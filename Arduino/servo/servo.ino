#define THINGER_SERVER "192.168.1.234"
//Needs to be on top, defines thinger server address

//Receiver represents a controller receiving data for controlling the instruments

//Wifi libraries
#include <SPI.h>
#include <ESP8266WiFi.h>
#include <ThingerESP8266.h>

#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

#define USER_ID             "Kloutschek"
#define DEVICE_ID           "controller"
#define DEVICE_CREDENTIAL   "bkmdHecCC6LI"
#define ledPin D1



// called this way, it uses the default address 0x40
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();
// you can also call it with a different address you want
//Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x41);
// you can also call it with a different address and I2C interface
//Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(&Wire, 0x40);

// Depending on your servo make, the pulse width min and max may vary, you 
// want these to be as small/large as possible without hitting the hard stop
// for max range. You'll have to tweak them as necessary to match the servos you
// have!
#define SERVOMIN  150 // this is the 'minimum' pulse length count (out of 4096)
#define SERVOMAX  600 // this is the 'maximum' pulse length count (out of 4096)

//Range of values from the sensors belonging to the guitar
#define GUITARMIN 900
#define GUITARMAX 1024

// Delay in milliseconds for how long servos should be at max
#define SERVODELAY 750


// our servo # counter
uint8_t servonum = 0;

const char *ssid = "dprj18";
const char *password = "Dprj18iot";

const int arraylength = 6;

//Booleans representing whether a instrument is in motion,
// Order: drum1, drum2, xylo1, xylo2, xylo3, xyol4
boolean instrumentActive[arraylength] = {false, false, false, false, false, false};

//Representing if each instrument has gotten a start message
boolean messageReceived[arraylength] = {false, false, false, false, false, false};

//int servominimum[7] = {150,150,150,150,150,150,150};

//int servomaximum[7] = {600,600,600,600,600,600,600};

//int servodelay[6] = {750,750,750,750,750,750};

//Starting time for instruments motions in milliseconds
// Order: drum1, drum2, xylo1, xylo2, xylo3, xyol4
long instrumentTimer[arraylength] = {0,0,0,0,0,0};

//port numbers
int servoPort[7] = {13,14,2,3,4,5,15};

//Guitar angle
int guitarValue = SERVOMIN;

//List containing messages from instruments
String instrumentNames[arraylength] = {"drum1", "drum2", "xylo1", "xylo2", "xylo3", "xylo4"};

ThingerESP8266 thing(USER_ID, DEVICE_ID, DEVICE_CREDENTIAL);

/*************************************************** 
  This is an example for our Adafruit 16-channel PWM & Servo driver
  Servo test - this will drive 8 servos, one after the other on the
  first 8 pins of the PCA9685

  Pick one up today in the adafruit shop!
  ------> http://www.adafruit.com/products/815
  
  These drivers use I2C to communicate, 2 pins are required to  
  interface.

  Adafruit invests time and resources providing this open source code, 
  please support Adafruit and open-source hardware by purchasing 
  products from Adafruit!

  Written by Limor Fried/Ladyada for Adafruit Industries.  
  BSD license, all text above must be included in any redistribution
 ****************************************************/

void setup() {
  Serial.begin(115200);
  //Serial.println("8 channel Servo test!");

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

  setupReceive();


  pwm.begin();
  
  pwm.setPWMFreq(60);  // Analog servos run at ~60 Hz updates

  //resetServos();

  delay(10);
}

// you can use this function if you'd like to set the pulse length in seconds
// e.g. setServoPulse(0, 0.001) is a ~1 millisecond pulse width. its not precise!
void setServoPulse(uint8_t n, double pulse) {
  double pulselength;
  
  pulselength = 1000000;   // 1,000,000 us per second
  pulselength /= 60;   // 60 Hz
  Serial.print(pulselength); Serial.println(" us per period"); 
  pulselength /= 4096;  // 12 bits of resolution
  Serial.print(pulselength); Serial.println(" us per bit"); 
  pulse *= 1000000;  // convert to us
  pulse /= pulselength;
  Serial.println(pulse);
  pwm.setPWM(n, 0, pulse);
}

//Function to read the received messages, probably needs the delays removed 
void setupReceive(){
  thing["receive"] << [](pson& in){
    String message = in["message"];
    Serial.println(message);

    if(message == "guitar"){
      int value = in["guitarData"];
      //Serial.println("Value was :");
      //Serial.println(value);
      guitarValue = map(value, GUITARMIN, GUITARMAX, SERVOMIN, SERVOMAX);
    }else{
      for(int i = 0; i < arraylength; i++){
        if(message == instrumentNames[i]){
           if(!messageReceived[i]){
              messageReceived[i] = true;
           }
        }
      }  
    } 
  };
}


void resetServos(){
  for(int i = 0; i < (arraylength+1); i++){
    pwm.setPWM(servoPort[i],0,300);
  }
}

void runServos(){  
  //Setting the value for the guitar
  pwm.setPWM(servoPort[6], 0, guitarValue);
  
  for(int i = 0; i < arraylength; i++){
    if(!instrumentActive[i] && messageReceived[i]){
      //Serial.println("Instrument: " + instrumentNames[i]);
      //Serial.println("Message received: " + messageReceived[i]);
      //Serial.println("instrumentActive: " + instrumentActive[i]);
      Serial.println(instrumentNames[i] + " Motor start");

      
      //Inte aktiv, fått meddelande, starta motor och timer
      pwm.setPWM(servoPort[i], 0, SERVOMAX);
      instrumentActive[i] = true;
      instrumentTimer[i] = millis() + SERVODELAY;
    }else if(instrumentActive[i] && (millis() > instrumentTimer[i])){
      Serial.println(instrumentNames[i] + " Motor off");
      messageReceived[i] = false;
      instrumentActive[i] = false;
      pwm.setPWM(servoPort[i], 0, SERVOMIN);
    }
  }
}



void loop() {
  thing.handle();
  runServos();
  
}
