# PLANTS VS. ZOMBIES - NBU web game team assignments
  
  ![PlantsVsZombies](/images/main.png)
  
## Contribution

* Teodor Angelov
* Kiril Borisov
* Arman Gemdjian

## Description

Simple prototype of the famous PlantsVsZombies game, created with HTML 5 and JavaScript.
Player starts the game with lightgreen screen (game field) where the plants are placed later.
On the right side of the sreen (originally it is on the top of the screen) there are 3 types
of plants:

1. Sunflower - 25 suns
2. Peashooter - 50 suns
3. Wallnut - 100 suns

Every plant has it's own cost. During the game player seeds peashooters to shoot zombies,
sunflowers to get more suns (the actual cost of the plants) and wallnuts - to stop zombies

## Gameplay

Player starts the game with 200 of suns (total amount of 'money') and after 10 seconds
(on every 10 seconds) a single zombie is spawned from the right of the sreen randomly on the
game field. After the initial seed of peashooter if it's on the row of the zombie it starts to 
shoot him and 3 shots are enought for the zombie to be killed. When the player seeds sunflowers
on fixed time (10 seconds) it gives 50 suns and player has some seconds to collect them. 
A wallnut is used to stop zombies, it lives about 15 seconds. 

**Actually, the game never ends...**

## Team work

Every contributor has it's own tasks:
* Teodor Angelov - implementation of zombies movement and demage
* Kiril Borisov - implementation of plants actions
* Arman Gemdjian - setting up canvas, testing and bug fixing

## Used technologies

* HTML 5 - for canvas
* Native JavaScript - for game logic, math, etc..

### If you have any advices for code improvements, bug fixes and adding new features please feel free to contribute to our repository : ) 