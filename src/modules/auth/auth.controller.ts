import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { RegisterAuthDto } from './dto/register-auth.dto';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return await this.authService.login(loginAuthDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerAuthDto: RegisterAuthDto) {
    return await this.authService.register(registerAuthDto);
  }
}
