import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token/token.service";
import { LoginAuthDto } from "./dto/login-auth.dto";
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from "./dto/register-auth.dto";
import getSafeUser from "src/common/utils/safe-user.util";
import { RefreshTokenAuthDto } from "./dto/refresh-token-auth.dto";
import * as jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "src/common/constant/app.constant";

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

    async refreshToken(refreshTokenAuthDto: RefreshTokenAuthDto) {
        const { accessToken, refreshToken } = refreshTokenAuthDto
        
        let decodeRefreshToken: any;
        let decodeAccessToken: any;

        try {
            decodeRefreshToken = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET as string);
            decodeAccessToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET as string, {
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