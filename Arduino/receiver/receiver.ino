#define THINGER_SERVER "ostkakan.cer.sgsnet.se"
//Needs to be on top, defines thinger server address

//Receiver represents a controller receiving data for controlling the instruments

//Wifi libraries
#include <SPI.h>
#include <ESP8266WiFi.h>
//#include <ThingerWifi.h>
#include <ThingerESP8266.h>

#define USER_ID             "Kloutschek"
#define DEVICE_ID           "instrument"
#define DEVICE_CREDENTIAL   "hejsan"
#define ledPin D1

const char *ssid = "iBlixt";
const char *password = "DanielWassbjer";

ThingerESP8266 thing(USER_ID, DEVICE_ID, DEVICE_CREDENTIAL);

void setup() {
  //Using the builtin LED to show when data is sent, might not be needed later
  pinMode(LED_BUILTIN, OUTPUT);

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  //Setting up Wifi
  delay(1000);
  Serial.begin(115200);
  //thing.add_wifi(ssid, password);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("success!");
  Serial.print("IP Address is: ");
  Serial.println(WiFi.localIP());

  /* Sends random numbers to server
  thing["send"] >> [](pson& out){
    out = rand(); // or just a fixed number (out = 3;)
  };*/ 
}

//Function to read the received messages, probably needs the delays removed 
void receiveMessage(){
  thing["receive"] << [](pson& in){
    String message = in["message"];
    Serial.println(message);

    //Starts the ledPin and blinks the builtin LED, probably needs to be removed later
    if(message == "hej"){
      //write to pin
      digitalWrite(ledPin, HIGH);
      digitalWrite(LED_BUILTIN, HIGH);
      delay(500);
      digitalWrite(ledPin, LOW);
      digitalWrite(LED_BUILTIN, LOW);
      delay(500);
    }else{
      digitalWrite(ledPin, LOW);
    }
  };
}

void loop() {
  thing.handle();
  //lol();
  receiveMessage();
}
