

class HeroActor extends Actor{
  constructor(world, x, y, classes, enemyClasses) {
    super(world);
    this.alive = true;
    this.ticksAlive = 0;

    this.x = typeof x === "undefined" ? Math.random() * world.width : x;
    this.y = typeof y === "undefined" ? Math.random() * world.height : y;
    this.heading = Math.random() * 2 * Math.PI;
    this.maxHealth = this.health = 48;

    this.timeLastAttack = 0;
    this.attackTicksCooldown = 30;
    this.speed = 1.3;
    this.damage = 13;
    this.armor = 110;

    this.classes = classes;
    this.enemyClasses = enemyClasses;

    this.elem = $(`<div class='actor hero-actor ${classes||""}'></div>`);
    this.weaponElem = $(`<div class='hero-actor-sword'></div>`);
    this.elem.append(this.weaponElem);
    this.setPosition();
    world.main.append(this.elem);
  }

  canAttack(){
    return this.ticksAlive - this.timeLastAttack >= this.attackTicksCooldown;
  }

  getTarget () {
    const VISION_RANGE = 1024;
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
      if((minEDist === null || enDist < minEDist) && enDist < VISION_RANGE) {
        minEDist = enDist;
        minEnemy = enemy;
      }
    }

    return { enemy: minEnemy, nearestActor: minActor };
  }

  angleToActor(actor){
    var globalAngle = Math.atan2(actor.y - this.y, actor.x - this.x);
    var phi = Math.abs(this.heading - globalAngle) % (2 * Math.PI); // This is either the distance or 360 - distance
    var distance = phi > (Math.PI) ? (2 * Math.PI) - phi : phi;
    return distance;
  }

  inSwipeRange(){
    const SWIPE_RANGE = 64;
    const SWIPE_ANGLE = Math.PI / 2;
    var enemies = [];

    for(var i=0; i < this.world.actors.length; ++i){
      var enemy = this.world.actors[i];
      if(enemy == this) continue; // Can't target self

      var actorDist = this.distanceToActor(enemy);
      var actorAngle = this.angleToActor(enemy)

      if(!enemy.hasClass(this.enemyClasses)) continue; // Skip anything that's not an enemy

      if(actorDist < SWIPE_RANGE && actorAngle) {
        enemies.push(enemy);
      }
    }
    return enemies;
  }

  tick(world) {

    const TOUCHING_DIST = 32;

    var { enemy, nearestActor } = this.getTarget();

    this.elem.removeClass("attacking");

    if(enemy){
      var enDist = this.distanceToActor(enemy);
      if(enDist <= TOUCHING_DIST || this.health / this.maxHealth < 0.25){ // Run away if too low health!!!
        // Don't overlap, back away if too close!!
        this.heading = Math.atan2(this.y - enemy.y, this.x - enemy.x);

        // Fighters are TOUCHING_DIST right now, kill both if distance is close enough.
        if(enDist <= TOUCHING_DIST + 4 && this.canAttack()){ // add 4 pixel buffer...
          enemy.applyDamage(this.damage);
          this.timeLastAttack = this.ticksAlive;
          this.elem.addClass("attacking");

          this.heading = Math.atan2(enemy.y - this.y, enemy.x - this.x);

          let enemiesInRange = this.inSwipeRange();
          enemiesInRange.map(enemy => enemy.applyDamage(this.damage * 1.1));
          this.weaponElem.css({
            display: 'block',
            transform: `rotate(${this.heading / Math.PI * 180}deg)`,
          });
        }
      }else{
        this.heading = Math.atan2(enemy.y - this.y, enemy.x - this.x);
      }
    }

    if(nearestActor){
      var actorDist = this.distanceToActor(nearestActor);
      if(actorDist <= TOUCHING_DIST){
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
