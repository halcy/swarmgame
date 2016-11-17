

class EmitterActor extends Actor{
  constructor(world) {
    super();
    this.alive = true;
    this.ticksAlive = 0;

    this.x = Math.random() * world.width;
    this.y = Math.random() * world.height;
    console.log(this.x, this.y);

    this.elem = $(`<div class='actor emitter-actor'></div>`);
    this.setPosition();
    world.main.append(this.elem);
  }

  setPosition() {
    this.elem.css({
      top: this.y + 'px',
      left: this.x + 'px',
    })
  }

  tick(world) {

    if(this.ticksAlive % 10 == 0){
      world.actors.push(new WanderActor(world, this.x, this.y));
    }

    this.ticksAlive++;
  }
}

class FighterEmitterActor extends Actor{
  constructor(world, extraClass, enemyClass) {
    super();
    this.alive = true;
    this.ticksAlive = 0;

    this.x = Math.random() * world.width;
    this.y = Math.random() * world.height;
    this.extraClass = extraClass;
    this.enemyClass = enemyClass;

    this.elem = $(`<div class='actor emitter-actor ${extraClass||""}'></div>`);
    this.setPosition();
    world.main.append(this.elem);
  }

  setPosition() {
    this.elem.css({
      top: this.y + 'px',
      left: this.x + 'px',
    })
  }

  tick(world) {

    if(this.ticksAlive % 10 == 0){
      world.actors.push(new FighterActor(world, this.x, this.y, this.extraClass, this.enemyClass));
    }

    this.ticksAlive++;
  }
}
