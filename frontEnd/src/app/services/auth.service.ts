import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  RegisterResponse, 
  MeResponse, 
  LogoutResponse 
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

}
