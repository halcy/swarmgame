

class EmitterActor extends Actor{
  constructor(world) {
    super(world);
    this.alive = true;
    this.ticksAlive = 0;

    this.x = Math.random() * world.width;
    this.y = Math.random() * world.height;

    this.hero = null;

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
  constructor(world, classes, enemyClasses, x, y) {
    super(world);
    this.alive = true;
    this.ticksAlive = 0;

    this.x = typeof x === "undefined" ? Math.random() * world.width : x;
    this.y = typeof y === "undefined" ? Math.random() * world.height : y;
    this.classes = classes;
    this.classes.push("emitter-actor");
    this.enemyClasses = enemyClasses;
    this.maxHealth = this.health = 100;

    this.timeLastAttack = 0;
    this.attackTicksCooldown = 30;
    this.pulseSpellRange = 64;
    this.pulseSpellDamage = 6;

    this.elem = $(`<div class='actor emitter-actor ${classes.join(' ')}'></div>`);
    this.setPosition();
    world.main.append(this.elem);
  }

  tick(world) {

    /*if(!this.hero || !this.hero.alive){
      this.hero = new HeroActor(world, this.x, this.y, this.classes, this.enemyClasses);
      world.actors.push(this.hero);
    }*/

    if(this.ticksAlive % 60 == 0){
      var newActorClasses = this.classes.slice();
      newActorClasses.splice(newActorClasses.indexOf("emitter-actor"), 1);
      world.actors.push(new FighterActor(world, this.x, this.y, newActorClasses, this.enemyClasses));
    }

    if(this.canPulse()){
      this.pulseDefense();
    }

    this.ticksAlive++;
  }

  canPulse(){
    return this.ticksAlive - this.timeLastAttack >= this.attackTicksCooldown;
  }
  pulseDefense() {
    var castIt = false;

    for(var i=0; i < this.world.actors.length; ++i){
      var enemy = this.world.actors[i];
      if(enemy == this) continue; // Can't target self
      if(!enemy.hasClass(this.enemyClasses)) continue; // Skip anything that's not an enemy

      var actorDist = this.distanceToActor(enemy);
      if(actorDist < this.pulseSpellRange) {
        enemy.applyDamage(this.pulseSpellDamage);
        castIt = true;
      }
    }

    if(castIt){
      this.elem.addClass("pulsing");
      this.timeLastAttack = this.ticksAlive;
      setTimeout(() => {
        this.elem.removeClass("pulsing");
      }, 100);
    }
  }
}
