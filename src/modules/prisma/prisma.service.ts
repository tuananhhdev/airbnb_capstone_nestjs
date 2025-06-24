import { Injectable, Logger, OnModuleInit, OnModuleDestroy, BadGatewayException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import pRetry from 'p-retry';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private isConnected = false;
    private readonly maxRetries = 3; // Số lần retry tối đa
    private readonly retryDelay = 2000; // Độ trễ giữa các lần retry (ms)

    async onModuleInit() {
        await this.connectWithRetry();
    }

    async onModuleDestroy() {
        await this.disconnectGracefully();
    }

    private async connectWithRetry() {
        const attemptConnect = async (attempt: number) => {
            try {
                await this.$connect();
                this.isConnected = true;
                const timestamp = new Date().toISOString();
                this.logger.log(
                    `✅ Database connected successfully at ${timestamp} (Attempt ${attempt})`,
                    { context: 'PrismaService.connectWithRetry' },
                );
            } catch (error) {
                this.isConnected = false;
                const errorMessage = `❌ Failed to connect to database: ${error.message}`;
                this.logger.error(errorMessage, error.stack, { context: 'PrismaService.connectWithRetry', attempt });
                if (attempt >= this.maxRetries) {
                    this.logger.error(
                        `❌ Max retries (${this.maxRetries}) reached. Terminating application...`,
                        error.stack,
                        { context: 'PrismaService.connectWithRetry' },
                    );
                    process.exit(1); // Dừng ứng dụng nếu vượt quá số lần retry
                }
                throw new Error(errorMessage); // Ném lỗi để retry
            }
        };

        try {
            await pRetry(attemptConnect, {
                retries: this.maxRetries - 1, // Vì pRetry tính retry từ 0
                minTimeout: this.retryDelay,
                maxTimeout: this.retryDelay * 2,
                onFailedAttempt: (error) => {
                    this.logger.warn(
                        `⚠️ Retry ${error.attemptNumber} failed. ${this.maxRetries - error.attemptNumber} attempts left.`,
                        { context: 'PrismaService.connectWithRetry' },
                    );
                },
            });
        } catch (error) {
            throw new BadGatewayException('Unable to connect to database after multiple attempts');
        }
    }

    private async disconnectGracefully() {
        if (!this.isConnected) {
            this.logger.warn('⚠️ No active database connection to disconnect', { context: 'PrismaService.disconnectGracefully' });
            return;
        }

        try {
            await this.$disconnect();
            this.isConnected = false;
            const timestamp = new Date().toISOString();
            this.logger.log(
                `🔌 Database disconnected at ${timestamp}`,
                { context: 'PrismaService.disconnectGracefully' },
            );
        } catch (error) {
            this.logger.error(
                `❌ Failed to disconnect from database: ${error.message}`,
                error.stack,
                { context: 'PrismaService.disconnectGracefully' },
            );
        }
    }

    // Kiểm tra trạng thái kết nối
    async checkConnection() {
        if (!this.isConnected) {
            this.logger.warn('⚠️ Database connection is not active', { context: 'PrismaService.checkConnection' });
            return false;
        }

        try {
            await this.$queryRaw`SELECT 1`;
            this.logger.debug('✅ Database connection is active', { context: 'PrismaService.checkConnection' });
            return true;
        } catch (error) {
            this.isConnected = false;
            this.logger.error(
                `❌ Database connection check failed: ${error.message}`,
                error.stack,
                { context: 'PrismaService.checkConnection' },
            );
            return false;
        }
    }


}