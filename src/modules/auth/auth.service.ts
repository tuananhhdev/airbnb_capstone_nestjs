import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "src/common/constant/app.constant";
import { PrismaService } from "../prisma/prisma.service";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { RefreshTokenAuthDto } from "./dto/refresh-token-auth.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";
import { TokenService } from "./token/token.service";
import { Users } from "@prisma/client";
import { getSafeData } from "src/common/utils/safe-data.util";

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly tokenService: TokenService,
        private readonly jwtService: JwtService
    ) { }

    async login(loginAuthDto: LoginAuthDto) {

        const { email, password } = loginAuthDto

        const userExist = await this.prismaService.users.findUnique({ where: { email: email } });
        if (!userExist) throw new BadRequestException("Tài khoản chưa tồn tại, vui lòng đăng ký")
        if (!userExist.password) throw new BadRequestException("Tài khoản không hợp lệ, vui lòng kiểm tra lại hoặc đăng ký tài khoản mới")

        const isPassword = bcrypt.compareSync(password, userExist.password)
        if (!isPassword) throw new BadRequestException("Tài khoản hoặc mật khẩu không chính xác, vui lòng kiểm tra lại")

        const tokens = this.tokenService.createTokens(userExist.id);

        return tokens
    }

    async register(registerAuthDto: RegisterAuthDto) {
        const { fullName, email, password } = registerAuthDto

        const userExist = await this.prismaService.users.findUnique({ where: { email: email } });
        if (userExist) throw new BadRequestException("Tài khoản đã tồn tại, vui lòng đăng ký tài khoản khác")

        const salt = bcrypt.genSaltSync(10);
        const hashPasword = bcrypt.hashSync(password, salt);

        const newUser = await this.prismaService.users.create({
            data: {
                fullName: fullName,
                email: email,
                password: hashPasword
            },
        })

        const safeUser = getSafeData(newUser as unknown as Users[])[0]

        return safeUser
    }

    async refreshToken(refreshTokenAuthDto: RefreshTokenAuthDto) {
        const { accessToken, refreshToken } = refreshTokenAuthDto

        let decodeRefreshToken: any;
        let decodeAccessToken: any;

        try {
            decodeRefreshToken = this.jwtService.verify(refreshToken, { secret: REFRESH_TOKEN_SECRET });
            decodeAccessToken = this.jwtService.verify(accessToken, {
                secret: ACCESS_TOKEN_SECRET,
                ignoreExpiration: true,
            });
        } catch (error) {
            throw new BadRequestException("Refresh token hợp lệ, vui lòng đăng ký tài khoản mới")
        }

        if (decodeRefreshToken.sub !== decodeAccessToken.sub) {
            throw new UnauthorizedException("Token không hợp lệ");
        }

        const tokens = this.tokenService.createTokens(decodeAccessToken.sub);

        return tokens
    }
}