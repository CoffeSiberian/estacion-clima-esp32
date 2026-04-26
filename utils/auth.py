import os
from fastapi import  HTTPException, Header
import bcrypt

def validar_contrasena(password: str = Header(alias="pass", description="Contraseña de acceso")):
    password_bytes = password.encode('utf-8')
    hash_guardado = os.environ["HASHED_PASSWORD"].encode('utf-8')
    es_valida = bcrypt.checkpw(password_bytes, hash_guardado)
    
    if not es_valida:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta o no autorizada")
    
    return "Validación exitosa"
