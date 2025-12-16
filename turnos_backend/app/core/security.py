from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from typing import Optional
import os
# app/core/security.py - VERSIÓN CORREGIDA
from passlib.context import CryptContext
import bcrypt

# Opción 1: Usando bcrypt directamente (más control)
def get_password_hash(password: str) -> str:
    # Asegurar que no exceda 72 bytes
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

# Opción 2: Usando passlib con truncamiento forzado
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash_passlib(password: str) -> str:
    # Fuerza truncamiento a 72 bytes
    password_bytes = password.encode('utf-8')[:72]
    truncated_password = password_bytes.decode('utf-8', 'ignore')
    return pwd_context.hash(truncated_password)

def verify_password_passlib(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')[:72]
    truncated_password = password_bytes.decode('utf-8', 'ignore')
    return pwd_context.verify(truncated_password, hashed_password)