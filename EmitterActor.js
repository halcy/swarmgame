

class EmitterActor extends Actor{
  constructor(world) {
    super(world);
    this.alive = true;
    this.ticksAlive = 0;

    this.x = Math.random() * world.width;
    this.y = Math.random() * world.height;

    this.elem = $(`<div class='actor emitter-actor'></div>`);
    this.setPosition();
    world.main.append(this.elem);
  }

  tick(world) {

    if(this.ticksAlive % 10 == 0){
      world.actors.push(new WanderActor(world, this.x, this.y));
    }

    this.ticksAlive++;
  }
}

class FighterEmitterActor extends Actor{
  constructor(world, classes, enemyClasses) {
    super(world);
    this.alive = true;
    this.ticksAlive = 0;

    this.x = Math.random() * world.width;
    this.y = Math.random() * world.height;
    this.classes = classes;
    this.enemyClasses = enemyClasses;
    this.maxHealth = this.health = 100;

    this.elem = $(`<div class='actor emitter-actor ${classes.join(' ')}'></div>`);
    this.setPosition();
    world.main.append(this.elem);
  }

  tick(world) {

    if(this.ticksAlive % 10 == 0){
      world.actors.push(new FighterActor(world, this.x, this.y, this.classes, this.enemyClasses));
    }

    this.ticksAlive++;
  }
}
