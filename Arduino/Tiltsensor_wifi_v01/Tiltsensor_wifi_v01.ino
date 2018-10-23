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
#define DEVICE_ID           "drumstick1"
#define DEVICE_CREDENTIAL   "OwZ6zPDxVhrq"

const char *ssid = "dprj18";
const char *password = "Dprj18iot";

ThingerESP8266 thing(USER_ID, DEVICE_ID, DEVICE_CREDENTIAL);

/* Better Debouncer

   This debouncing circuit is more rugged, and will work with tilt switches!

   http://www.ladyada.net/learn/sensor/tilt.html
*/

int inPin = D2;         // the number of the input pin
int outPin = LED_BUILTIN;       // the number of the output pin

int LEDstate = HIGH;      // the current state of the output pin
int reading;           // the current reading from the input pin
int previous = LOW;    // the previous reading from the input pin

// the following variables are long because the time, measured in miliseconds,
// will quickly become a bigger number than can be stored in an int.
long thetime = 0;         // the last time the output pin was toggled
long debounce = 150;   // the debounce time, increase if the output flickers

void setup()
{
  Serial.begin(115200);

  //Setting up the tilt sensor
  Serial.println("Setting up tilt sensor");
  pinMode(inPin, INPUT);
  digitalWrite(inPin, HIGH);   // turn on the built in pull-up resistor
  //pinMode(outPin, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  //Serial.begin(9600);


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
void sendMessage() {
  pson data;

  //message is hej, can be changed, "instrument" is the reciever.
  data["message"] = "drum1";
  thing.call_device("controller", "receive" , data);
  //thing.stream(thing["send"]);
}

void loop()
{

  //Fixes the thinger things
  thing.handle();

  /*
    digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
    Serial.print(HIGH);
    delay(100);                       // wait for a second
    //digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
    Serial.print(LOW);
    delay(1000);                       // wait for a second
  */
  int switchstate;


  reading = digitalRead(inPin);

  // If the switch changed, due to bounce or pressing...
  if (reading != previous) {
    // reset the debouncing timer
    thetime = millis();
  }

  if ((millis() - thetime) > debounce) {
    // whatever the switch is at, its been there for a long time
    // so lets settle on it!
    switchstate = reading;
    Serial.print("Switchstate = ");
    Serial.println(switchstate);


    // Now invert the output on the pin13 LED
    if (switchstate == HIGH) {

      LEDstate = LOW;
      Serial.println("LOW");
      sendMessage(); //Send message
      Serial.println("Message was sent");
    }
    else {
      LEDstate = HIGH;
      Serial.println("HIGH");
    }
  }
  digitalWrite(LED_BUILTIN, LEDstate);

  // Save the last reading so we keep a running tally
  previous = reading;



}
