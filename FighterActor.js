class FighterActor extends Actor {
    constructor(world, x, y, classes, enemyClasses) {
        super(world);
        this.alive = true;
        this.ticksAlive = 0;

        this.x = typeof x === "undefined" ? Math.random() * world.width : x;
        this.y = typeof y === "undefined" ? Math.random() * world.height : y;
        this.heading = Math.random() * 2 * Math.PI;
        this.maxHealth = this.health = 16;

        this.timeLastAttack = 0;
        this.attackTicksCooldown = 30;
        this.speed = 1.3;
        this.damage = 7;

        this.classes = classes;
        this.classes.push("fighter-actor");
        this.enemyClasses = enemyClasses;

        this.elem = $(`<div class='actor wander-actor ${classes.join(' ')}'></div>`);
        this.setPosition();
        world.main.append(this.elem);
        
        this.operationMode = 0;
    }

    canAttack() {
        return this.ticksAlive - this.timeLastAttack >= this.attackTicksCooldown;
    }

    getLocalInformation() {
        var minActor = null;
        var minADist = null;
        var minEnemy = null;
        var minEDist = null;
        var minFriend = null;
        var minFDist = null;
        
        var minEnemyEmitter = null;
        var minEEDist = null;
        var minFriendEmitter = null;
        var minFEDist = null;
        
        var enemyMassX = 0.0;
        var enemyMassY = 0.0;
        var enemyCount = 0.0;
        
        var friendMassX = 0.0;
        var friendMassY = 0.0;
        var friendCount = 0.0;
        
        for (var i = 0; i < this.world.actors.length; ++i) {
            var actor = this.world.actors[i];
            
            if(actor.hasClass(this.enemyClasses) && !actor.hasClass("emitter-actor")) {
                enemyMassX += actor.x;
                enemyMassY += actor.y;
                enemyCount += 1.0;
            }
            
            if(!actor.hasClass(!this.enemyClasses) && !actor.hasClass("emitter-actor")) {
                friendMassX += actor.x;
                friendMassY += actor.y;
                friendCount += 1.0;
            }
            
            if (actor == this) continue; // Can't target self

            var actorDist = this.distanceToActor(actor);
            if (minADist === null || actorDist < minADist) {
                minADist = actorDist;
                minActor = actor;
            }

            var enDist = this.distanceToActor(actor);
            if ((minEDist === null || enDist < minEDist) && actor.hasClass(this.enemyClasses)) {
                minEDist = enDist;
                minEnemy = actor;
            }

            var frDist = this.distanceToActor(actor);
            if ((minFDist === null || frDist < minFDist) && !actor.hasClass(this.enemyClasses)) {
                minFDist = frDist;
                minFriend = actor;
            }
            
            var enEDist = this.distanceToActor(actor);
            if ((minEEDist === null || enEDist < minEEDist) && actor.hasClass(this.enemyClasses) && actor.hasClass("emitter-actor")) {
                minEEDist = enEDist;
                minEnemyEmitter = actor;
            }

            var frEDist = this.distanceToActor(actor);
            if ((minFEDist === null || frEDist < minFEDist) && !actor.hasClass(this.enemyClasses) && actor.hasClass("emitter-actor")) {
                minFEDist = frEDist;
                minFriendEmitter = actor;
            }
        }

        
        return {
            enemyX: minEnemy.x,
            enemyY: minEnemy.y,
            friendX: minFriend.x,
            friendY: minFriend.y,
            nearestActorX: minActor.x,
            nearestActorY: minActor.y,
            minEnemyEmitterX: minEnemyEmitter.x,
            minEnemyEmitterY: minEnemyEmitter.y,
            minFriendEmitterX: minFriendEmitter.x,
            minFriendEmitterY: minFriendEmitter.y,
            enemyMassX: enemyMassX / enemyCount,
            enemyMassY: enemyMassY / enemyCount,
            friendMassX: friendMassX / friendCount,
            friendMassY: friendMassY / friendCount,     
            friendCount: enemyCount,
            enemyCount: enemyCount,
        };
    }

    getNearestNonEmitterActor() {
        var minActor = null;
        var minADist = null;

        for (var i = 0; i < this.world.actors.length; ++i) {
            var actor = this.world.actors[i];
            if (actor == this) continue; // Can't target self

            var actorDist = this.distanceToActor(actor);
            if ((minADist === null || actorDist < minADist) && !actor.hasClass("emitter-actor")) {
                minADist = actorDist;
                minActor = actor;
            }
        }

        return minActor;
    }
    
    getNearestEnemy() {
        var minEnemy = null;
        var minEDist = null;

        for (var i = 0; i < this.world.actors.length; ++i) {
            var actor = this.world.actors[i];
            if (actor == this) continue; // Can't target self

            var enDist = this.distanceToActor(actor);
            if ((minEDist === null || enDist < minEDist) && actor.hasClass(this.enemyClasses)) {
                minEDist = enDist;
                minEnemy = actor;
            }
        }

        return minEnemy;
    }
    
    getBehaviour() {
        var featureSet = this.getLocalInformation();
        
        if(this.hasClass("attack-nearest")) {
            return [featureSet["enemyX"], featureSet["enemyY"]];
        }
        
        if(this.hasClass("attack-mass")) {
            return [featureSet["enemyMassX"], featureSet["enemyMassY"]];
        }
        
        if(this.hasClass("attack-random")) {
            if((this.ticksAlive % 60 * 15) == 0) {
                this.operationMode = Math.trunc(Math.random() * 7);
            }
            var featureArr = Object.keys(featureSet).map(function(key){ return featureSet[key]; });
            return [featureArr[this.operationMode * 2], featureArr[this.operationMode * 2 + 1]];
        }
    }

    tick(world) {

        const TOUCHING_DIST = 16;

        var [targetX, targetY] = this.getBehaviour();
        var enemy = this.getNearestEnemy();
        var nearestActor = this.getNearestNonEmitterActor();
        
        this.elem.removeClass("attacking");

        if (enemy) {
            var enDist = this.distanceToActor(enemy);
            if (enDist <= TOUCHING_DIST || this.health / this.maxHealth < 0.25) { // Run away if too low health!!!
                // Don't overlap, back away if too close!!
                this.heading = Math.atan2(this.y - enemy.y, this.x - enemy.x);

                // Fighters are TOUCHING_DIST right now, kill both if distance is close enough.
                if (enDist <= TOUCHING_DIST + 4 && this.canAttack()) { // add 4 pixel buffer...
                    enemy.applyDamage(this.damage);
                    this.timeLastAttack = this.ticksAlive;
                    this.elem.addClass("attacking");
                }
            }
        }

        if (nearestActor) {
            var actorDist = this.distanceToActor(nearestActor);
            if (actorDist <= TOUCHING_DIST) {
                // Don't overlap, back away if too close!!
                this.heading = Math.atan2(this.y - nearestActor.y, this.x - nearestActor.x);
            }
            else {
                this.heading = Math.atan2(targetY - this.y, targetX - this.x);
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