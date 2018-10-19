## Thinger.io

**Local server:** `http://{ip_address}/thinger`  
**Online server:** [`https://ostkakan.cer.sgsnet.se`](https://ostkakan.cer.sgsnet.se) 

**Username:** Kloutschek  
**Password:** Alexander  

### "internal server error"

If Thinger.io gives the "internal server error" message when trying to sign in, it's most likely because the Pi was shutdown incorrectly, and Mongodb doesn't appreciate that.

To fix, run a repair:
```
$ sudo mongod --dbpath data/ --repair
```

Then replace some old, broken files with a fresh pair:
```
$ sudo rm -rf /var/lib/mongodb/{mongod.lock,storage.bson}  
$ sudo cp data/* /var/lib/mongodb/
```

Set `mongodb:nogroup` as the owner of the files to truly satisfy Mongodb:
```
$ sudo chown mongodb:nogroup /var/lib/mongodb/*
```

Finally, restart the Mongodb service:
```
$ sudo systemctl restart mongodb
```

## Raspberry Pi

**Username:** pi  
**Password:** abc123  

Connect via SSH:
```
$ ssh pi@{ip_address}
```

Web page is located at `/var/www/html/`. Config files for web server are located at `/etc/nginx/` (e.g. `/etc/nginx/sites-available/default` to config default web page). 
