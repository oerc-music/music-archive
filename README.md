# Music Archive

public (web) music archive, initially for performances of Climb! as
part of the EPSRC-funded FAST IMPACt project and the 
University of Nottingham Culture and Heritage RPA.

See [docs/designnotes.md](docs/designnotes.md)

Note: branch linkapps is WIP to add a synchronized muzivisual app view.

## Install / set up

If using [Vagrant](https://www.vagrantup.com/), 
```
vagrant up
```

## Log processor

See [logproc/](logproc/)

## archive app

dev
```
cd ../archive-app
npm install -g @angular/cli
npm install --no-bin-links
ng serve --host=0.0.0.0
```
build
```
ng build -bh /1/archive/
cd dist
tar zcf ../archive.tgz *
```
Copy to server and unpack.

