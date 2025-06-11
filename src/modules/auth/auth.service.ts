import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token/token.service";
import { LoginAuthDto } from "./dto/login-auth.dto";
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from "./dto/register-auth.dto";
import getSafeUser from "src/common/utils/safe-user.util";

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly tokenService: TokenService
    ) { }

    async login(loginAuthDto: LoginAuthDto) {

        const { email, password } = loginAuthDto

        const userExist = await this.prismaService.users.findUnique({ where: { email } });
        if (!userExist) throw new BadRequestException("Tài khoản chưa tồn tại, vui lòng đăng ký")
        if (!userExist.password) throw new BadRequestException("Tài khoản không hợp lệ, vui lòng kiểm tra lại hoặc đăng ký tài khoản mới")

        const isPassword = bcrypt.compareSync(password, userExist.password)
        if (!isPassword) throw new BadRequestException("Tài khoản hoặc mật khẩu không chính xác, vui lòng kiểm tra lại")

        const tokens = this.tokenService.createTokens(userExist.id);

        return tokens
    }

    async register(registerAuthDto: RegisterAuthDto) {
        const { fullName, email, password } = registerAuthDto

        const userExist = await this.prismaService.users.findUnique({ where: { email } });
        if (userExist) throw new BadRequestException("Tài khoản đã tồn tại, vui lòng đăng ký tài khoản khác")

        const salt = bcrypt.genSaltSync(10);
        const hashPasword = bcrypt.hashSync(password, salt);

        const newUser = await this.prismaService.users.create({
            data: {
                fullName,
                email,
                password: hashPasword
            },
        })

        return getSafeUser(newUser)
    }
}