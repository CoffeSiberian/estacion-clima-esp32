#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <DHT.h>

// ==========================================
// ⚙️ CONFIGURACIÓN
// ==========================================

// --- SELECTOR DE SENSOR ---
// 1 = Sensor AHT21 (Usa pines I2C: SDA=21, SCL=22)
// 2 = Sensor AM2302 / DHT22 (Usa 1 pin digital)
const int TIPO_SENSOR = 2; 

// Pin de datos para el AM2302 (Modifícalo según donde lo conectes)
const int PIN_AM2302 = 4;  

// --------------------------

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
// 🧩 OBJETOS DE LOS SENSORES
// ==========================================
Adafruit_AHTX0 aht;
DHT dht(PIN_AM2302, DHT22); // El AM2302 usa el protocolo del DHT22

void setup() {
  Serial.begin(115200);
  
  // 1. Inicializar el Sensor seleccionado
  if (TIPO_SENSOR == 1) {
    if (!aht.begin()) {
      Serial.println("Error crítico: No se encontró el sensor AHT21.");
      while (1) delay(10);
    }
    Serial.println("Sensor AHT21 OK.");
  } 
  else if (TIPO_SENSOR == 2) {
    dht.begin();
    Serial.println("Sensor AM2302 (DHT22) OK.");
  }

  // 2. Conectar a Wi-Fi
  conectarWiFi();
}

void loop() {
  // Verificamos si la conexión Wi-Fi se cayó para reconectar
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  // Comprobamos si ya pasaron los 10 segundos
  unsigned long tiempoActual = millis();
  if (tiempoActual - tiempoAnterior >= intervaloEnvio) {
    tiempoAnterior = tiempoActual; // Reiniciamos el cronómetro
    
    float temp = 0.0;
    float hum = 0.0;
    bool lecturaValida = true;

    // Leemos el sensor dependiendo del tipo elegido
    if (TIPO_SENSOR == 1) {
      sensors_event_t humedad, temperatura;
      aht.getEvent(&humedad, &temperatura);
      temp = temperatura.temperature;
      hum = humedad.relative_humidity;
    } 
    else if (TIPO_SENSOR == 2) {
      temp = dht.readTemperature();
      hum = dht.readHumidity();
      
      // Los sensores tipo DHT a veces fallan una lectura. Aquí lo validamos:
      if (isnan(temp) || isnan(hum)) {
        Serial.println("Error leyendo el sensor AM2302. Se omitirá este envío.");
        lecturaValida = false;
      }
    }

    // Si la lectura fue correcta, enviamos los datos
    if (lecturaValida) {
      enviarDatosAlServidor(temp, hum);
    }
  }
}

// ==========================================
// 🛠️ FUNCIONES MODULARES
// ==========================================

void conectarWiFi() {
  Serial.print("Conectando a Wi-Fi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);

  int intentos = 0; 

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    intentos++; 

    if (intentos >= 20) {
      Serial.println("\n¡Error crítico! No se pudo conectar al Wi-Fi.");
      Serial.println("Reiniciando el ESP32 en 3 segundos...");
      delay(3000); 
      ESP.restart(); 
    }
  }
  
  Serial.println("\n¡Wi-Fi conectado!");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());
}

void enviarDatosAlServidor(float temp, float hum) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    Serial.print("Conectando al servidor... ");
    http.begin(serverUrl);
    
    http.addHeader("Content-Type", "application/json"); 
    http.addHeader("pass", apiPass);                    

    JsonDocument doc;
    doc["temperatura"] = temp;
    doc["humedad"]     = hum;
    doc["fk_sensor"]   = fk_sensor;

    String payload;
    serializeJson(doc, payload);

    Serial.println("Enviando Payload:");
    Serial.println(payload);

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      Serial.print("Código de respuesta HTTP: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error en la petición POST. Código: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Error en conexión Wi-Fi, no se puede enviar el dato.");
  }
  Serial.println("----------------------------------------");
}