#define THINGER_SERVER "192.168.1.234"
//This define has to be at the top of the document and contains the location of the thinger server

//Sender represents a sensor sending data

//Libraries for Wifi connectivity
#include <SPI.h>
#include <ESP8266WiFi.h>
//#include <ThingerWifi.h>
#include <ThingerESP8266.h>

//Login for Thinger server
#define USER_ID             "Kloutschek"
#define DEVICE_ID           "flexSensor" //FIXA! 
#define DEVICE_CREDENTIAL   "hmtRd&O&okzx"

const char *ssid = "dprj18";
const char *password = "Dprj18iot";

ThingerESP8266 thing(USER_ID, DEVICE_ID, DEVICE_CREDENTIAL);

const int flexpin = 0; 
int prevState = 0; 
int curState = 0;
int outPin = LED_BUILTIN;

void setup() {
  // put your setup code here, to run once:

  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
//Setting up Wifi
  delay(1000);

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


//Function to send message to another device
void sendMessage(int servoposition) {
  pson data;

  //message is hej, can be changed, "instrument" is the reciever.
  data["message"] = "guitar";
  data["guitarData"] = servoposition;
  thing.call_device("controller", "receive" , data);
  //thing.stream(thing["send"]);
}

void loop() {
  //Fixes the thinger things
  thing.handle();

  
  int flexposition;    // Input value from the analog pin.
  //int servoposition;   // Output value to the servo.

  flexposition = analogRead(flexpin);

  sendMessage(flexposition);

  //servoposition = map(flexposition, 3, 400, 0, 180);
  //servoposition = constrain(servoposition, 0, 180);

  //servo1.write(servoposition);
  
  Serial.print("sensor: ");
  Serial.println(flexposition);
  //Serial.print("  servo: ");
  //Serial.println(servoposition);


  delay(50);  // wait 20ms between servo updates

}
