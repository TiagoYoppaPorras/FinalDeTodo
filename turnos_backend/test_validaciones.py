import requests
import json
from datetime import date, timedelta

# CONFIGURACIÓN
BASE_URL = "http://127.0.0.1:8000"
VERDE = "\033[92m"
ROJO = "\033[91m"
RESET = "\033[0m"
AMARILLO = "\033[93m"

def print_result(test_name, success, message=""):
    estado = f"{VERDE}✅ PASÓ{RESET}" if success else f"{ROJO}❌ FALLÓ{RESET}"
    print(f"{estado} | {test_name} - {message}")

def get_token(email, password):
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        if response.status_code == 200:
            return response.json()["access_token"]
    except:
        return None
    return None

def run_tests():
    print(f"\n{AMARILLO}--- INICIANDO AUDITORÍA DE VALIDACIONES ---{RESET}\n")

    # ---------------------------------------------------------
    # 1. VALIDACIONES DE USUARIOS (Email y Duplicados)
    # ---------------------------------------------------------
    print(f"{AMARILLO}>>> GRUPO 1: USUARIOS E INPUTS{RESET}")
    
    # Test 1.1: Crear usuario con email inválido
    payload_bad_email = {"nombre": "Test", "email": "soyunmailsinarroba", "password": "123"}
    # Nota: Usamos requests directo sin token porque register suele ser público o admin
    # Asumimos que tienes un admin creado para obtener token primero
    
    # Login Admin (Asegurate de tener este usuario en tu DB o crealo)
    token_admin = get_token("admin@example.com", "admin123") 
    if not token_admin:
        print(f"{ROJO}⚠ CRÍTICO: No se pudo loguear como admin. Crea un usuario 'admin@admin.com' / 'admin123' para correr los tests.{RESET}")
        return

    headers = {"Authorization": f"Bearer {token_admin}"}

    # Test 1.1: Email sin formato
    try:
        res = requests.post(f"{BASE_URL}/usuarios/", json=payload_bad_email, headers=headers)
        print_result("Email Inválido", res.status_code == 422 or res.status_code == 400, f"Status: {res.status_code}")
    except: print_result("Email Inválido", False, "Error de conexión")

    # ---------------------------------------------------------
    # 2. VALIDACIONES DE KINESIÓLOGOS (Integridad)
    # ---------------------------------------------------------
    print(f"\n{AMARILLO}>>> GRUPO 2: KINESIÓLOGOS{RESET}")

    # Test 2.1: Crear Kinesiólogo Duplicado (Misma Matrícula)
    # Primero creamos uno válido
    payload_kine = {"nombre": "Kine Test", "email": "kine.test@mail.com", "password": "123", "matricula_profesional": "MP-9999", "especialidad": "Test"}
    requests.post(f"{BASE_URL}/kinesiologos/con-usuario", json=payload_kine, headers=headers)
    
    # Intentamos crear OTRO con la misma matrícula
    payload_dup = {"nombre": "Kine Impostor", "email": "impostor@mail.com", "password": "123", "matricula_profesional": "MP-9999"}
    res = requests.post(f"{BASE_URL}/kinesiologos/con-usuario", json=payload_dup, headers=headers)
    print_result("Matrícula Duplicada", res.status_code == 400, "El sistema bloqueó la matrícula repetida")

    # ---------------------------------------------------------
    # 3. VALIDACIONES DE TURNOS (Lógica de Negocio)
    # ---------------------------------------------------------
    print(f"\n{AMARILLO}>>> GRUPO 3: TURNOS Y DISPONIBILIDAD{RESET}")
    
    # Setup: Necesitamos IDs. Asumimos que el kine creado arriba tiene ID... difícil saberlo sin query.
    # Vamos a listar kinesiologos para obtener el ID del que creamos
    kines = requests.get(f"{BASE_URL}/kinesiologos/", headers=headers).json()
    if not kines:
        print("No hay kinesiologos para probar turnos.")
    else:
        kine_id = kines[-1]['id'] # Usamos el último creado
        
        # Test 3.1: Turno en Fin de Semana
        # Calculamos el próximo sábado
        today = date.today()
        dias_para_sabado = (5 - today.weekday() + 7) % 7
        if dias_para_sabado == 0: dias_para_sabado = 7
        fecha_sabado = str(today + timedelta(days=dias_para_sabado))
        
        payload_sabado = {
            "paciente_id": 1, "kinesiologo_id": kine_id, "servicio_id": 1, "sala_id": 1,
            "fecha": fecha_sabado, "hora_inicio": "10:00", "estado": "pendiente"
        }
        res = requests.post(f"{BASE_URL}/turnos/", json=payload_sabado, headers=headers)
        print_result("Bloqueo Fin de Semana", res.status_code == 400, f"Intentó agendar el {fecha_sabado}")

        # Test 3.2: Solapamiento (Crear turno válido y luego uno encima)
        fecha_lunes = str(today + timedelta(days=(7 - today.weekday()) + 1)) # Próximo lunes
        payload_ok = {
            "paciente_id": 1, "kinesiologo_id": kine_id, "servicio_id": 1, "sala_id": 1,
            "fecha": fecha_lunes, "hora_inicio": "10:00", "estado": "pendiente"
        }
        # Crear el primero (debería funcionar)
        requests.post(f"{BASE_URL}/turnos/", json=payload_ok, headers=headers)
        
        # Crear el segundo (debería fallar por ocupado)
        res = requests.post(f"{BASE_URL}/turnos/", json=payload_ok, headers=headers)
        print_result("Bloqueo Solapamiento", res.status_code == 400, "No permitió dos turnos misma hora/kine")

        # Test 3.3: Integridad de Borrado (Eliminar Kine con turno)
        res = requests.delete(f"{BASE_URL}/kinesiologos/{kine_id}", headers=headers)
        print_result("Integridad Borrado Kine", res.status_code == 400, "No dejó borrar kine con turno pendiente")

    # ---------------------------------------------------------
    # 4. SEGURIDAD (Historias Clínicas)
    # ---------------------------------------------------------
    print(f"\n{AMARILLO}>>> GRUPO 4: SEGURIDAD Y ROLES{RESET}")
    
    # Crear un usuario paciente para probar
    payload_pac = {"nombre": "Paciente Test", "email": "paciente.test@mail.com", "password": "123", "dni": "999999"}
    requests.post(f"{BASE_URL}/pacientes/con-usuario", json=payload_pac, headers=headers)
    token_paciente = get_token("paciente.test@mail.com", "123")
    
    if token_paciente:
        headers_pac = {"Authorization": f"Bearer {token_paciente}"}
        # Paciente intenta ver TODAS las historias clinicas (endpoint admin)
        res = requests.get(f"{BASE_URL}/historias-clinicas/", headers=headers_pac)
        print_result("Privacidad Historias Clínicas", res.status_code == 403, "Paciente recibió 403 Forbidden al intentar ver listado global")
    else:
        print("No se pudo loguear el paciente test para validar seguridad.")

if __name__ == "__main__":
    run_tests()