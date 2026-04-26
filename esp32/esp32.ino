#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>

// ==========================================
// ⚙️ CONFIGURACIÓN
// ==========================================
// Wi-Fi
const char* ssid     = "wifi";
const char* password = "pass";

// Servidor REST
const char* serverUrl  = "http://192.168.1.1:8000/registros/";
const char* apiPass    = "pass1234"; // Cambia esto por tu contraseña real
const char* fk_sensor  = "FK_SENSOR_001"; // Identificador del sensor, cámbialo por el que corresponda en tu base de datos

// Tiempos
const unsigned long intervaloEnvio = 10000; // 10 segundos en milisegundos
unsigned long tiempoAnterior = 0;

// ==========================================

Adafruit_AHTX0 aht;

void setup() {
  Serial.begin(115200);
  
  // 1. Inicializar Sensor
  if (!aht.begin()) {
    Serial.println("Error crítico: No se encontró el sensor AHT21.");
    while (1) delay(10);
  }
  Serial.println("Sensor AHT21 OK.");

  // 2. Conectar a Wi-Fi
  conectarWiFi();
}

void loop() {
  // Verificamos si la conexión Wi-Fi se cayó para reconectar
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  // Comprobamos si ya pasaron los 10 segundos usando millis() en vez de delay()
  unsigned long tiempoActual = millis();
  if (tiempoActual - tiempoAnterior >= intervaloEnvio) {
    tiempoAnterior = tiempoActual; // Reiniciamos el cronómetro
    
    // Leemos el sensor
    sensors_event_t humedad, temperatura;
    aht.getEvent(&humedad, &temperatura);

    // Enviamos los datos
    enviarDatosAlServidor(temperatura.temperature, humedad.relative_humidity);
  }
}

// ==========================================
// 🛠️ FUNCIONES MODULARES
// ==========================================

void conectarWiFi() {
  Serial.print("Conectando a Wi-Fi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);

  int intentos = 0; // Creamos un contador

  // Esperamos a que conecte
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    intentos++; // Sumamos 1 al contador cada medio segundo

    // Si llega a 20 intentos (es decir, pasaron 10 segundos)
    if (intentos >= 20) {
      Serial.println("\n¡Error crítico! No se pudo conectar al Wi-Fi.");
      Serial.println("Reiniciando el ESP32 en 3 segundos...");
      delay(3000); // Damos un respiro de 3 segundos para poder leer este mensaje
      
      ESP.restart(); // 🔄 AQUÍ SE REINICIA LA PLACA
    }
  }
  
  Serial.println("\n¡Wi-Fi conectado!");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());
}

void enviarDatosAlServidor(float temp, float hum) {
  // Comprobamos que tenemos conexión antes de intentar enviar
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    Serial.print("Conectando al servidor... ");
    http.begin(serverUrl);
    
    // Añadimos los Headers
    http.addHeader("Content-Type", "application/json"); // Indicamos que el body es JSON
    http.addHeader("pass", apiPass);                    // Tu header de seguridad personalizado

    // Creamos el documento JSON usando ArduinoJson (v7)
    JsonDocument doc;
    doc["temperatura"] = temp;
    doc["humedad"]     = hum;
    doc["fk_sensor"]   = fk_sensor;

    // Convertimos el objeto JSON a un texto (String)
    String payload;
    serializeJson(doc, payload);

    Serial.println("Enviando Payload:");
    Serial.println(payload);

    // Hacemos la petición POST
    int httpResponseCode = http.POST(payload);

    // Evaluamos la respuesta del servidor
    if (httpResponseCode > 0) {
      Serial.print("Código de respuesta HTTP: ");
      Serial.println(httpResponseCode);
      
      // Si quieres ver qué te responde el servidor, descomenta esta línea:
      // String response = http.getString(); Serial.println(response);
    } else {
      Serial.print("Error en la petición POST. Código: ");
      Serial.println(httpResponseCode);
    }

    // Liberamos recursos
    http.end();
  } else {
    Serial.println("Error en conexión Wi-Fi, no se puede enviar el dato.");
  }
  Serial.println("----------------------------------------");
}
