#define THINGER_SERVER "ostkakan.cer.sgsnet.se"
//This define has to be at the top of the document and contains the location of the thinger server

//Sender represents a sensor sending data

//Libraries for Wifi connectivity
#include <SPI.h>
#include <ESP8266WiFi.h>
//#include <ThingerWifi.h>
#include <ThingerESP8266.h>

//Login for Thinger server
#define USER_ID             "Kloutschek"
#define DEVICE_ID           "wemos"
#define DEVICE_CREDENTIAL   "hejsan"

//Potential output pin
#define buttonPin D0


//const char *ssid = "iBlixt";
//const char *password = "DanielWassbjer";

const char *ssid = "iBlixt";
const char *password = "DanielWassbjer";

//const int  buttonPin = 0;    // the pin that the pushbutton is attached to
int buttonState = 0;         // current state of the button
int lastButtonState = 0;   // previous state of the button

ThingerESP8266 thing(USER_ID, DEVICE_ID, DEVICE_CREDENTIAL);

void setup() {

  // initialize the button pin as a input:
  pinMode(buttonPin, INPUT);

  //Using the builtin LED to show when data is sent, might not be needed later
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  
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

//Function to send message to another device
void sendMessage(){
  pson data;

  //message is hej, can be changed, "instrument" is the reciever.
  data["message"] = "hej";
  thing.call_device("instrument", "receive" , data);
  //thing.stream(thing["send"]);
}

void loop() {
  //Fixes the thinger things
  thing.handle();

  // read the pushbutton input pin:
  buttonState = digitalRead(buttonPin);
  //Serial.println(buttonState);

  if (buttonState != lastButtonState) {
    // if the state has changed, increment the counter
    if (buttonState == LOW) {
      // if the current state is HIGH then the button went from off to on:
      
      Serial.println("Message was sent");
      digitalWrite(LED_BUILTIN, HIGH);
      
    } else {
      // if the current state is LOW then the button went from on to off:
      sendMessage();
      digitalWrite(LED_BUILTIN, LOW);
    }
    // Delay a little bit to avoid bouncing
    //delay(50);
  }
  // save the current state as the last state, for next time through the loop
  lastButtonState = buttonState;
}
