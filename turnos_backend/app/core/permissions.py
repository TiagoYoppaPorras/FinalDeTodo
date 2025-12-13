from fastapi import Depends, HTTPException, status
from app.core.token import get_current_user

def role_required(*roles_permitidos):
    def wrapper(current_user=Depends(get_current_user)):
        user_roles = [r.name for r in current_user.roles]
        if not any(r in roles_permitidos for r in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para esta acción"
            )
        return current_user
    return wrapper
