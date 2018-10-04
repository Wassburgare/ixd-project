#include <Servo.h>
Servo myservo;

const int  signalPin = 2;

int signalState = 0;
int lastSignalState = 0;
int count = 90;
boolean countUp = true;

void setup() {
  myservo.attach(9);
  pinMode(signalPin, INPUT_PULLUP);
  myservo.write(120);
  Serial.begin(9600);
}


void loop() {
  
  
  signalState = digitalRead(signalPin);
  Serial.println(signalState);
  /*
  if (signalState != lastSignalState) {
    if (signalState == HIGH) {
      Serial.println("Detects HIGH");
      myservo.write(160);
    } else {
      Serial.println("Detects LOW");
      myservo.write(120);
    }
    delay(50);
  }*/
  myservo.write(count);

  if(count > 160){
    countUp = false;
  }else if(count < 90){
    countUp = true;
  }

  if(countUp){
    count = count+1;
  }else{
    count = count-1;
  }

  delay(10);
  
  lastSignalState = signalState;

}
