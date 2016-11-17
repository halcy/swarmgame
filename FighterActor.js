

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
    var minDist = null;

    for(var i=0; i < this.world.actors.length; ++i){
      var enemy = this.world.actors[i];

      if(enemy == this) continue; // Can't target self
      if(!enemy.hasClass(this.enemyClasses)) continue; // Skip anything that's not an enemy

      var enDist = this.distanceToActor(enemy);

      // Fighters are 16px right now, kill both if distance is close enough.
      if(enDist < 16 && this.canAttack()){
        enemy.applyDamage(2);
        this.timeLastAttack = this.ticksAlive;
      }

      if(minDist === null || enDist < minDist) {
        minDist = enDist;
        minEnemy = enemy;
      }
    }

    return minEnemy;
  }

  tick(world) {

    var target = this.getTarget();

    if(target){
      var enDist = this.distanceToActor(target);
      if(enDist <= 16 || this.health / this.maxHealth < 0.25){ // Run away if too low health!!!
        // Don't overlap, back away if too close.
        this.heading = Math.atan2(this.y - target.y, this.x - target.x);
      }else{
        this.heading = Math.atan2(target.y - this.y, target.x - this.x);
      }
    }//else{
      this.heading += (Math.PI / 8) * (Math.random() * 2 - 1);
    //}
    this.x += 5 * Math.cos(this.heading);
    this.y += 5 * Math.sin(this.heading);
    this.setPosition();

    this.ticksAlive++;

    // Slow regen!!!!!
    this.health += 0.1;
    this.health = Math.min(this.health, this.maxHealth);
  }
}
