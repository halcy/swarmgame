

class FighterActor extends Actor{
  constructor(world, x, y, extraClass, enemyClass) {
    super();
    this.alive = true;
    this.ticksAlive = 0;

    this.x = typeof x === "undefined" ? Math.random() * world.width : x;
    this.y = typeof y === "undefined" ? Math.random() * world.height : y;
    this.heading = Math.random() * 2 * Math.PI;

    this.elem = $(`<div class='actor wander-actor ${extraClass||""}'></div>`);
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

    this.heading += (Math.PI / 8) * (Math.random() * 2 - 1);
    this.x += 5 * Math.cos(this.heading);
    this.y += 5 * Math.sin(this.heading);
    this.setPosition();

    this.ticksAlive++;
    if(this.ticksAlive > 100){
      this.alive = false;
      this.elem.remove();
    }
  }
}
