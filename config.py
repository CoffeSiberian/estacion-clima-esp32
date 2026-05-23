import os

# Minutos entre filas guardadas en el histórico (REGISTRO).
# Los sensores postean cada ~10s; solo se persiste una fila cada este intervalo.
# Editable por env o cambiando el default.
INTERVALO_HISTORICO_MINUTOS = int(os.getenv("INTERVALO_HISTORICO_MINUTOS", "5"))
