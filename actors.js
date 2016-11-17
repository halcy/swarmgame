
var HP_CLASSES = ["hp-0", "hp-10", "hp-20", "hp-30", "hp-40", "hp-50", "hp-60", "hp-70", "hp-80", "hp-90", "hp-100"];
HP_CLASSES.reverse();

class Actor {
  constructor(world) {
    this.world = world;
    this.alive = true;
    this.ticksAlive = 0;
    this.x = Math.random() * world.width;
    this.y = Math.random() * world.height;
    //this.elem = $("<div class='actor'></div>");
    //world.main.append(this.elem);
    this.classes = [];
    this.enemyClasses = [];
    this.maxHealth = this.health = 1;
    this.armor = 0;
  }
  tick(world) {
    this.ticksAlive++;
  }

  setPosition() {
    this.rebindToWorld();
    this.elem.css({
      top: this.y + 'px',
      left: this.x + 'px',
    })
  }
  rebindToWorld() {
    if(this.x < 0) this.x = 0;
    if(this.y < 0) this.y = 0;
    if(this.x >= this.world.width) this.x = this.world.width - 1;
    if(this.y >= this.world.height) this.y = this.world.height - 1;
  }
  distanceToActor(actor){
    return Math.sqrt(Math.pow(actor.x - this.x, 2) + Math.pow(actor.y - this.y, 2));
  }
  hasClass(className){
    if(Array.isArray(className)){
      return className.map(c => this.hasClass(c)).reduce((a, b) => a && b, true);
    }
    return this.classes.indexOf(className) >= 0;
  }
  kill() {
    this.alive = false;
    this.elem && this.elem.remove();
  }
  applyDamage(dmg, fatal = true) {
    var scaledDmg = dmg * Math.exp(-this.armor / 100);
    console.log("Took damage", scaledDmg, ": ", this.health, "=>", this.health - scaledDmg);
    this.health -= scaledDmg;

    if(this.elem){
      var newHealthClass = Math.floor((Math.max(0, this.health) / this.maxHealth) * (HP_CLASSES.length - 1));
      //console.log(this.health, this.maxHealth, this.health / this.maxHealth, (this.health / this.maxHealth) * (HP_CLASSES.length - 1), "gives index:", Math.floor((this.health / this.maxHealth) * (HP_CLASSES.length - 1)), "of", HP_CLASSES.length);
      this.elem.removeClass(HP_CLASSES.join(" "))
        .addClass(`hp ${HP_CLASSES[newHealthClass]}`);
      //console.log(this.ticksAlive, this.elem.attr("class").split(' '));
    }

    if(fatal && this.health <= 0) this.kill();
  }
}

class WanderActor extends Actor{
  constructor(world, x, y) {
    super(world);
    this.alive = true;
    this.ticksAlive = 0;

    this.x = typeof x === "undefined" ? Math.random() * world.width : x;
    this.y = typeof y === "undefined" ? Math.random() * world.height : y;
    this.heading = Math.random() * 2 * Math.PI;

    this.elem = $("<div class='actor wander-actor'></div>");
    this.setPosition();
    world.main.append(this.elem);
  }

  tick(world) {

    this.heading += (Math.PI / 8) * (Math.random() * 2 - 1);
    this.x += 1 * Math.cos(this.heading);
    this.y += 1 * Math.sin(this.heading);
    this.setPosition();

    this.ticksAlive++;
    if(this.ticksAlive > 100){
      this.kill();
    }
  }
}
