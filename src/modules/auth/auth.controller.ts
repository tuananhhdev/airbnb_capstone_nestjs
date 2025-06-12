import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { RefreshTokenAuthDto } from './dto/refresh-token-auth.dto';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Public()
  @Post('register')
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }


  @Post('refresh-token')
  refreshToken(@Body() refreshTokenAuthDto: RefreshTokenAuthDto) {
    return this.authService.refreshToken(refreshTokenAuthDto);
  }
}
