import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { RefreshTokenAuthDto } from './dto/refresh-token-auth.dto';
import { SuccessMessage } from 'src/common/decorator/success-mesage.decorator';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  @SuccessMessage('Đăng nhập tài khoản thành công')
  @ApiOperation({ summary: 'Đăng nhập tài khoản' })
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Public()
  @Post('register')
  @SuccessMessage('Đăng ký tài khoản thành công')
  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }


  @Public()
  @Post('refresh-token')
  @SuccessMessage('Làm mới token thành công')
  @ApiOperation({ summary: 'Làm mới token bị hết hạn' })
  refreshToken(@Body() refreshTokenAuthDto: RefreshTokenAuthDto) {
    return this.authService.refreshToken(refreshTokenAuthDto);
  }
}
