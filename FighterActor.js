

class FighterActor extends Actor{
  constructor(world, x, y, classes, enemyClasses) {
    super(world);
    this.alive = true;
    this.ticksAlive = 0;

    this.x = typeof x === "undefined" ? Math.random() * world.width : x;
    this.y = typeof y === "undefined" ? Math.random() * world.height : y;
    this.heading = Math.random() * 2 * Math.PI;
    this.maxHealth = this.health = 16;
    this.timeLastAttack = 0;
    this.attackTicksCooldown = 5;
    this.speed = 1.3;

    this.classes = classes;
    this.enemyClasses = enemyClasses;

    this.elem = $(`<div class='actor wander-actor ${classes||""}'></div>`);
    this.setPosition();
    world.main.append(this.elem);
  }

  canAttack(){
    return this.ticksAlive - this.timeLastAttack >= this.attackTicksCooldown;
  }

  getTarget () {
    var minEnemy = null;
    var minEDist = null;
    var minActor = null;
    var minADist = null;

    for(var i=0; i < this.world.actors.length; ++i){
      var enemy = this.world.actors[i];
      if(enemy == this) continue; // Can't target self

      var actorDist = this.distanceToActor(enemy);
      if(minADist === null || actorDist < minADist) {
        minADist = actorDist;
        minActor = enemy;
      }

      if(!enemy.hasClass(this.enemyClasses)) continue; // Skip anything that's not an enemy

      var enDist = this.distanceToActor(enemy);
      if(minEDist === null || enDist < minEDist) {
        minEDist = enDist;
        minEnemy = enemy;
      }
    }

    return { enemy: minEnemy, nearestActor: minActor };
  }

  tick(world) {

    const TOUCHING_DIST = 16;

    var { enemy, nearestActor } = this.getTarget();

    if(enemy){
      var enDist = this.distanceToActor(enemy);
      if(enDist <= TOUCHING_DIST || this.health / this.maxHealth < 0.25){ // Run away if too low health!!!
        // Don't overlap, back away if too close!!
        this.heading = Math.atan2(this.y - enemy.y, this.x - enemy.x);

        // Fighters are TOUCHING_DIST right now, kill both if distance is close enough.
        if(enDist <= TOUCHING_DIST && this.canAttack()){
          enemy.applyDamage(2);
          this.timeLastAttack = this.ticksAlive;
        }
      }else{
        this.heading = Math.atan2(enemy.y - this.y, enemy.x - this.x);
      }
    }

    if(nearestActor){
      var actorDist = this.distanceToActor(nearestActor);
      if(enDist <= TOUCHING_DIST){
        // Don't overlap, back away if too close!!
        this.heading = Math.atan2(this.y - nearestActor.y, this.x - nearestActor.x);
      }
    }

    // Add randomness to path...
    this.heading += (Math.PI / 8) * (Math.random() * 2 - 1);
    this.x += this.speed * Math.cos(this.heading);
    this.y += this.speed * Math.sin(this.heading);
    this.setPosition();

    this.ticksAlive++;

    // Slow regen!!!!!
    this.health += 0.1;
    this.health = Math.min(this.health, this.maxHealth);
  }
}
