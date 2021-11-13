# FlightGear Companion

Little things that ARE making a diffrence!

Set of small features that are enhancing the FG experience. (List of planned/added features below)

##### Warning!

This project is work in progress and is not polished. Code is messy and really bad at error handling.
These things should be fixed in the future.
Proceed with caution!

## Features

- [X] Discord Rich Presence
  - [X] Basic Rich Presence
  - [X] Customization Options
  - [X] Custom Placeholders
  - [X] Join in Multiplayer
- [ ] Auto Updates (Coming REALLY Soon)
- [ ] Addon App Store (Coming Soon)
- [ ] LiveATC Dynamic Radio
- [ ] Better Flight Stats

If you have any suggestions - use GitHub Issues with proper tag!

### Check out other FGCompanion projects:

* [FGCompanion - Poland Enhanced](https://github.com/klaudiae/fgcompanion-polandenhanced) (custom scenery adding better Polish airports, compatible with OSM Buildings)

## Running from source

Firstly install [git](https://git-scm.com/) (recommended) and [Node + NPM](https://nodejs.org/en/) (mandatory, Latest > LTS)

1. Clone the repository either by downloading as zip and unpacking or running `git clone https://github.com/justkowal/FGCompanion`
2. In the directory containing repo run `npm install`
   (On Linux _RClick > Open in terminal_. On Windows _Shift + RClick > Open PowerShell Window Here_)
3. Run `npm start` to start the app

## Compiling from source

Once again [Node + NPM](https://nodejs.org/en/) (Latest > LTS) is needed

1. Do the steps 1 & 2 from "Running from source"
2. Use `npx electron-packager . FGCompanion --platform=[ex. win32]`
   For more detailed options refer to `electron-packager` manual

**Credits:**

* JustKowal (Coding and stuff)
* Klaudiae (Beating JustKowal with a ~~carrot~~ Carrot shaped pencil case)
