namespace myGame {

    function reset(own: Character, bullet: wave, damage = 1, hitrec = 100, hurted = 1,
                   breakdef = false, xspeed = 50, yspeed = 20, rebound = false,
                   indeflectible = false, isDestroyed = false, perishTogether = 0){
        bullet.own = own
        bullet.damage = damage //伤害
        bullet.hitrec = hitrec //被攻击方硬直时间
        bullet.hurted = hurted //攻击轻重,越大越容易击倒
        bullet.breakdef = breakdef //是否破防
        bullet.xspeed = xspeed //击飞时的x轴速度
        bullet.yspeed = yspeed //击飞时的y轴速度
        bullet.rebound = rebound //反射敌方子弹
        bullet.indeflectible = indeflectible //不受反射
        bullet.isDestroyed = isDestroyed //已消亡
        bullet.perishTogether = perishTogether //碰撞存活优先级
        bullet.collision = 0 //上次碰撞类型：0=>未碰撞/超时重制, 1=>子弹碰子弹, 2=>子弹碰人
        bullet.interval = -1 //碰撞后不消亡使用的时钟
        bullet.circlock = -1
        bullet.overlapAct = ()=>{} //碰撞后的行为
        bullet.overlapKind = 3 //引发overlapAct的碰撞类型：1=>子弹碰子弹, 2=>子弹碰人, 3=>任意
        bullet.dir = 2 //朝向 1->左，2->右
        bullet.attachOwner = false //所有者被攻击时自动销毁
        bullet.blastAnim = null //爆炸(销毁)动画
    }

    //重叠消亡 k(collision): 0=>未碰撞/超时重置, 1=>子弹碰子弹, 2=>子弹碰人; v: 碰撞存活优先级
    function perish(sprite: wave, k: number, v: number){
        sprite.collision = k
        if(sprite.overlapKind == 3 || sprite.collision == sprite.overlapKind){
            sprite.overlapAct()
        }
        if(sprite.perishTogether != -1 && sprite.perishTogether <= v){
            sprite.destroy()
        }
        else{
            if(sprite.interval == -1 && sprite.collision == 2)
            {
                sprite.interval = setTimeout(function() {
                    sprite.interval = -1
                    sprite.collision = 0
                }, 600)
            }
        }
    }

    export class Character{
        laspres = -1 //方向. 1:左，2:右
        rushspeed = 80 //奔跑速度
        jumpspeed = 100 //起跳速度
        walkspeed = 40 //行走速度
        /*
                                |->timeout(0)
         0 -> rightdown(1) -> rightup(2) -> rightdown(3.rush) -> rightup(5.rush)
                |->timeout(-1) -> rightup(0)
         */
        rightDOWN = 0 //右走中.0:松开 -1:按下、按住 1:按下 2:按一下松开 3:连按两下(按住) 5:连按两下松开
        leftDOWN = 0 //左走中
        defence = 0 //防御中
        /**
         * skill = 0: 常态
         * skill = 1: ⬇️.defence状态
         * skill = 2: ↑.jump状态
         * skill = 3: ⬇️+↑.特殊技能
         * skill = 4: ➡️+➡️.rush状态
         * skill = 6: ➡️+➡️+↑.rush+jump状态
         * skill = 8: ➡️.行走状态
         * skill = 9: ⬇️+➡️.特殊技能
         * skill = 10: ⬇️+➡️（按下松开）.特殊技能
         */
        skill = 0 //技能状态
        damageA = 2 //A伤害
        hitrecA = 200 //A造成的硬直
        damageB = 4 //B伤害
        hitrecB = 300 //B造成的硬直
        defencelas = 100 //按一下防御的持续时间
        defact = 300 //反击的最长反应时间
        def = 0.5 //防御减伤系数
        def2 = 1 //防御技能的防御减伤系数
        hurtedDown = 1 //防御技能的受伤硬直时间降低系数
        downtime = 1500 //被击倒躺地上的时间
        immutime = 1500 //起身后的无敌时间
        rush = 0 //奔跑中
        jump = 0 //跳跃中
        combo = 0 //连击中
        attack = 0 //攻击中
        hurted = 0 //受攻击硬直中 -1:防御状态下受伤(可反击)，0:无受伤，1:受伤，2:受伤瞬间
        hitoverST = 0 //击飞中
        hitk = 1 //击飞速度修正
        immu = 0 //无敌中
        enemySprite: Sprite = null
        attachBullet: wave[] = []
        setEnemy(other: Sprite){
            this.enemySprite = other
        }
        comboclock = -1 //连击倒计时
        defclock = -1 //反击倒计时
        def2clock = -1 //防御技能减伤计时
        hurtedDownclock = -1 //防御技能减硬直计时
        immuclock = -1 //无敌技能计时
        hurtclock = -1 //硬直恢复倒计时
        attackclock = -1 //自动攻击
        hitclock = -1 //被连续击打的最长间隔计时
        hitclock2 = -1 //被连续击打的最短间隔计时
        jumpclock = -1 //起跳落地
        standard = assets.standard

        standards: Image[] = null
        rstandards: Image[] = null
        rstandard = assets.rstandard
        defenceimg = assets.defenceimg
        hitover = assets.hitover
        quickst = assets.quickst
        lieimg = assets.lieimg
        attackA = assets.attackA
        attackB = assets.attackB
        rushA = assets.rushA
        rushB = assets.rushB
        hand = assets.hand
        rushhand = assets.rushhand
        leg = assets.leg
        rushleg = assets.rushleg
        walkimg = assets.walkimg
        hurtedimg = assets.hurtedimg

        get sprite(): Sprite {
            return this.mySprite
        }

        get enemy(): Sprite {
            return this.enemySprite
        }

        get x(): number {
            return this.mySprite.x
        }

        get y(): number {
            return this.mySprite.y
        }

        get hp(): number {
            return this.statusbar.value
        }

        get mp(): number {
            return this.mpbar.value
        }

        set hp(v : number) {
            this.statusbar.value = v
        }

        set mp(v : number) {
            this.mpbar.value = v
        }

        // 暂停控制
        stop () {
            this.move(0)
        }
        // 恢复控制
        move (speed: number) {
            this.player.moveSprite(this.mySprite, speed, 0)
        }

        // 从攻击、硬直、防御、奔跑等状态恢复
        stand (interrupt : boolean = false) {
            if(!interrupt || (2&this.attack|this.hurted) == 0){
                this.mySprite.setImage(this.standard.clone())
                if(this.laspres == 1){
                    this.mySprite.image.flipX()
                }
                this.hurted = 0
                this.defence = 0
                if(this.rush == 1){
                    this.rush = 0
                    this.skill = 0
                    if(this.rightDOWN == 5 || this.rightDOWN == 3){
                        this.rightDOWN = 0
                    }
                    if(this.leftDOWN == 5 || this.leftDOWN == 3){
                        this.leftDOWN = 0
                    }
                }
                this.attack = 0
                if(this.jump == 0){
                    this.mySprite.vx = 0
                    this.move(this.walkspeed)
                }
            }
        }
        // 落地之后做某事
        toground(dosth: ()=>void){
            let f = false
            if(this.jump == 1 && this.hitoverST == 1){ //受身
                this.hitoverST = 0
                this.hurted = 0
                this.mySprite.setImage(this.quickst.clone())
                if(this.laspres == 1){
                    this.mySprite.image.flipX()
                }
                clearInterval(this.jumpclock)
                this.jumpclock = -1
                this.hits = 0
                this.hits2 = 0
                this.skill = 11
                f = true
            }
            let ty = this.mySprite.y
            this.jumpclock = setInterval(()=>{
                if(this.mySprite.y == ty){
                    dosth()
                    clearInterval(this.jumpclock)
                    this.jumpclock = -1
                    if(f){
                        this.stand()
                        this.move(this.walkspeed)
                    }
                }
                else{
                    ty = this.mySprite.y
                }
            }, 100)
        }
        //=================== 中弹 ===================
        hits = 0
        hits2 = 0
        overlap(sprite: Sprite, otherSprite: Sprite) {
            if((<wave>sprite).interval != -1){
                return
            }
            if(this.immu == 1){
                perish(<wave>sprite, 0, 0)
                return
            }
            if((<wave>sprite).damage == 0){
                return
            }
            if ((this.defence == 1 || this.def2 != 1) && !((<wave>sprite).breakdef)) {
                clearTimeout(this.defclock)
                this.defclock = -1
                this.statusbar.value -= (<wave>sprite).damage * this.def * this.def2
                let img = this.defenceimg.clone()
                if(sprite.x < otherSprite.x){
                    img.flipX()
                    this.laspres = 1
                }
                else{
                    this.laspres = 2
                }
                if(this.defence == 1 && this.def2 == 1){
                    this.mySprite.setImage(img)
                    this.hurted = -1
                    this.defclock = setTimeout(()=>{
                        this.defclock = -1
                        if(this.hurted == -1){
                            this.hurted = 0
                        }
                    }, this.defact)
                }
            } else {
                if(this.attack == 2){
                    clearInterval(this.attackclock)
                    this.attackclock = -1
                }
                animation.stopAnimation(animation.AnimationTypes.All, this.mySprite)
                this.defence = 0
                this.def2 = 1
                clearTimeout(this.def2clock)
                this.def2clock=-1
                this.attack = 0
                this.skill = 0
                this.mySprite.vx = 0
                this.statusbar.value -= (<wave>sprite).damage
                if(this.hits < -100){
                    if(this.hurted != 2){
                        this.mySprite.vy = Math.max(this.mySprite.vy-(<wave>sprite).yspeed, -150) * this.hitk
                        this.mySprite.vx = (sprite.x < otherSprite.x ? (<wave>sprite).xspeed : -(<wave>sprite).xspeed) * this.hitk
                        this.mySprite.image.flipY()
                        this.hurted = 2
                        clearTimeout(this.hitclock2)
                        this.hitclock2 = setTimeout(()=>{
                            if(this.hurted == 2){
                                this.hurted = 1
                                this.hits2 = this.hits
                            }
                            this.hitclock2 = -1
                        }, 100)
                    }
                }
                else{
                    if(this.hurted != 2){
                        this.hurted = 2
                        clearTimeout(this.hitclock2)
                        this.hitclock2 = setTimeout(()=>{
                            if(this.hurted == 2){
                                this.hurted = 1
                                this.hits2 = this.hits
                            }
                            this.hitclock2 = -1
                        }, 100)
                    }
                    this.hits = Math.max(this.hits2+(<wave>sprite).hurted, this.hits)
                    //this.hits += (<wave>sprite).hurted //Math.max(++this.hits, (<wave>sprite).hurted)
                    this.hitrec((<wave>sprite).hitrec, this.hits-1, sprite.x < otherSprite.x, <wave>sprite)
                }
                while (this.attachBullet.length != 0) {
                    let b = this.attachBullet.removeAt(0)
                    b.destroy()
                }
            }
            perish(<wave>sprite, 2, 0)
            if (this.statusbar.value == 0) {
                if(this.player == controller.player1){
                    game.splash("player2 win!")
                }
                else{
                    game.splash("player1 win!")
                }
                game.reset()
            }
        }

        //time: 硬直时间， kind: 受伤动作， dir: 攻击对象在左边， pro: 造成攻击的弹射物
        hitrec(time: number, kind: number, dir: boolean, pro: wave){
            clearTimeout(this.hitclock)
            this.hitclock = -1
            clearTimeout(this.hurtclock)
            this.hurtclock = -1
            this.stop()
            if(kind >= this.hurtedimg.length || this.jump == 1){
                this.mySprite.setImage(this.hitover.clone())
                this.hits = -999
                this.mySprite.vy = -pro.yspeed
                this.mySprite.vx = dir ? pro.xspeed : -pro.xspeed
                if(this.jump == 1){
                    clearInterval(this.jumpclock)
                    this.jumpclock = -1
                    this.jump = 0
                }
                this.hitoverST = 1
                this.toground(()=>{
                    this.mySprite.setImage(this.lieimg.clone())
                    if(dir){
                        this.mySprite.image.flipX()
                    }
                    this.mySprite.vx = 0
                    this.immu = 1
                    this.hits = 0
                    this.hits2 = 0
                    this.hitoverST = 0
                    setTimeout(()=>{
                        let c1: number
                        let c2: number
                        let c3: number
                        c1 = setInterval(()=>{
                            this.mySprite.setFlag(SpriteFlag.Invisible, true)
                        }, 200)
                        c3 = setTimeout(()=>{
                            c3 = -1
                            c2 = setInterval(()=>{
                                this.mySprite.setFlag(SpriteFlag.Invisible, false)
                            }, 200)
                        }, 100)
                        this.stand()
                        setTimeout(()=>{
                            this.immu = 0
                            clearInterval(c1)
                            clearInterval(c2)
                            clearTimeout(c3)
                            this.mySprite.setFlag(SpriteFlag.Invisible, false)
                        }, this.immutime)
                    }, this.downtime)
                })
            }
            else{
                this.mySprite.setImage(this.hurtedimg[kind].clone())
                this.hurtclock = setTimeout(()=>{this.hurtclock = -1; this.stand()}, time*this.hurtedDown)
                this.hitclock = setTimeout(()=>{this.hitclock = -1; this.hits = 0}, 1000)
            }
            if(dir){
                this.mySprite.image.flipX()
                this.laspres = 1
            }
            else {
                this.laspres = 2
            }
        }
        //=================== 攻击行为 ===================
        attackPosture(atk: Image, life: number){
            this.attack = 1
            let img222 = atk.clone()
            animation.stopAnimation(animation.AnimationTypes.All, this.mySprite)
            let projectile = <wave>sprites.createProjectileFromSprite(img222, this.mySprite, this.mySprite.vx, 0)
            projectile.lifespan = life;
            let follow: number
            follow = setInterval(()=>{
                if(projectile != null && !projectile.isDestroyed){
                    if(this.hurted == 0){
                        projectile.setPosition(this.mySprite.x, this.mySprite.y)
                        //projectile.setVelocity(this.mySprite.vx, this.mySprite.vy)
                        //projectile.ax = this.mySprite.ax
                        //projectile.ay = this.mySprite.ay
                    }
                    else{
                        projectile.destroy();
                    }
                }
                else{
                    clearInterval(follow)
                    follow = -1
                }
            }, 10)
            reset(this, projectile)
            if (this.laspres == 1) {
                projectile.image.flipX()
                projectile.dir = 1
            }
            projectile.setKind(this.bulletkind)
            projectile.indeflectible = true
            return projectile
        }
        attackAction (atk: Image, life: number, Aatk: boolean) {
            let projectile = this.attackPosture(atk, life)
            if(Aatk){
                reset(this, projectile, this.damageA, this.hitrecA)
            }
            else{
                reset(this, projectile, this.damageB, this.hitrecB, 2)
            }
        }

        rushAttack(atk = 'A', time = 300){
            if(this.hurted != 0){
                return
            }
            let f = atk == 'A'
            this.attackAction(f ? this.rushhand : this.rushleg, time, f)
            this.defence = 0
            this.mySprite.setImage((f ? this.rushA : this.rushB).clone())
            if (this.laspres == 1) {
                this.mySprite.image.flipX()
            }
            setTimeout(()=>{this.stand(true)}, time)
        }
        basicAttack(atk = 'A', time = 200){
            if(this.hurted != 0){
                return
            }
            let h = atk == 'A'
            this.attackAction(h ? this.hand : this.leg, time, h)
            this.defence = 0
            this.stop()
            this.mySprite.setImage((h ? this.attackA : this.attackB).clone())
            if (this.laspres == 1) {
                this.mySprite.image.flipX()
            }
            setTimeout(()=>{this.stand(true)}, time)
        }
        defaultshoot = (s:wave)=>{}

        // 自动攻击，暂停控制，按[下]退出
        autoAttack(time: number, mp: number, atk: ()=>void){
            this.stop()
            this.attack = 2
            this.attackclock = setInterval(()=>{
                if(mp > this.mpbar.value){
                    clearInterval(this.attackclock)
                    this.stand()
                    this.attackclock = -1
                }
                else{
                    this.mpbar.value -= mp
                    atk()
                }
            }, time)
            this.defence = 0
        }
        // 反击，防御状态被攻击才能发出
        counterAttack(mp: number, atk: ()=>void){
            if(this.hurted == -1 && mp <= this.mpbar.value){
                this.hurted = 0
                this.skill = 0
                this.mpbar.value -= mp
                atk()
                if(this.defence != 0){
                    this.stand(true)
                }
            }
        }

        defaultskill(){
            //=================== A键释放的技能 ===================
            setSkill(this, SkillKind.A, 0, (tempVar: tempVarDic, that: Character)=>{ //平A: A
                that.basicAttack('A')
            })

            setSkill(this, SkillKind.A1, 0, (tempVar: tempVarDic, that: Character)=>{ //反击: ⬇️+A
                that.counterAttack(0, ()=>{
                    that.basicAttack('A')
                    let s = 60
                    for(let i = 0; i < 3; ++i){
                        for(let i = 0; i < 3; ++i){
                            shoot(that, 60, 180, 4, s, that.mySprite.x, that.mySprite.y, img`
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . 4 4 . . . . . . .
                                . . . . . . 4 5 5 4 . . . . . .
                                . . . . . . 2 5 5 2 . . . . . .
                                . . . . . . . 2 2 . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                            `, that.defaultshoot)
                            s += 3
                        }
                        shoot(that, 60, 180, 4, s, that.mySprite.x, that.mySprite.y, img`
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . 4 4 . . . . . . .
                            . . . . . . 4 5 5 4 . . . . . .
                            . . . . . . 2 5 5 2 . . . . . .
                            . . . . . . . 2 2 . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                        `, that.defaultshoot)
                        s += 10
                    }
                })
            })

            setSkill(this, SkillKind.A2, 0, (tempVar: tempVarDic, that: Character)=>{ //跳起攻击: ↑+A
                that.basicAttack('A')
            })

            setSkill(this, SkillKind.A3, 0, (tempVar: tempVarDic, that: Character)=>{ //跳起特殊攻击: ⬇️+↑+A
                that.basicAttack('A')
                let offset2 = 0
                let acc = 0
                for(let i = 0; i < 4; ++i){
                    shoot(that, 120+offset2, 300+offset2, 6, 50+acc, that.mySprite.x, that.mySprite.y, img`
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . 2 2 . . . . . . .
                        . . . . . . 3 1 1 3 . . . . . .
                        . . . . . 2 1 1 1 1 2 . . . . .
                        . . . . . 2 1 1 1 1 2 . . . . .
                        . . . . . . 3 1 1 3 . . . . . .
                        . . . . . . . 2 2 . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                    `, (s:wave)=>{
                        s.lifespan = 600
                        s.damage = 1
                    })
                    offset2 += 5
                    acc += 5
                }
            })

            setSkill(this, SkillKind.A4, 0, (tempVar: tempVarDic, that: Character)=>{ //冲刺: ➡️➡️+A
                that.rushAttack('A')
            })

            setSkill(this, SkillKind.A6, 0, (tempVar: tempVarDic, that: Character)=>{ //冲跳攻: ➡️➡️+↑+A
                that.rushAttack('A')
            })

            setSkill(this, SkillKind.A8, 0, (tempVar: tempVarDic, that: Character)=>{ //平A2: ➡️+A
                that.basicAttack('A')
                shoot(that, 180, 180, 1, 60, that.mySprite.x,that.mySprite.y,img`
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . 8 8 8 8 . . .
                    . . . . . . . 8 8 1 1 1 1 8 . .
                    . . . . 8 8 9 9 1 1 1 1 1 1 8 .
                    . . 9 9 9 9 1 1 1 1 1 1 1 1 8 .
                    . . 1 1 1 1 1 1 1 1 1 1 1 1 8 .
                    . . 9 9 8 8 9 1 1 1 1 1 1 1 8 .
                    . . . . . . 8 8 9 1 1 1 1 8 . .
                    . . . . . . . . . 8 8 8 8 . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                `, (b:wave)=>{
                    b.hitrec = 1200
                })
            })

            setSkill(this, SkillKind.A9, 0, (tempVar: tempVarDic, that: Character)=>{ //反击2: ↘️+A
                that.basicAttack('A')
                let s = 40
                let a = 10
                let t = 600
                for(let i = 0; i < 8; ++i){
                    shoot(that, a, a, 1, s, that.mySprite.x, that.mySprite.y, img`
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . 6 6 . . . . . . .
                        . . . . . . 6 9 9 6 . . . . . .
                        . . . . . . 8 9 9 8 . . . . . .
                        . . . . . . . 8 8 . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                    `,
                        (b: wave)=>{
                            setTimeout(()=>{
                                b.vx *= 1.5
                                b.vy *= 1.5
                                aimedshot(b)
                            }, t)
                        })
                    s += 10
                    a+= 160/8
                    t += 100
                }
            })

            setSkill(this, SkillKind.A10, 0, (tempVar: tempVarDic, that: Character)=>{ //必杀: ⬇️+➡️+A
                that.rushAttack('A')
                let d = that.laspres == 1 ? -10 : 10
                shoot(that, 180, 180, 1, 60, that.mySprite.x+d,that.mySprite.y,img`
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . 2 2 2 2 . . .
                    . . . 2 2 2 2 2 2 1 1 1 1 2 . .
                    . . . 3 3 3 3 3 1 1 1 1 1 1 . .
                    . . . 1 1 1 1 1 1 1 1 1 1 1 . .
                    . . . 1 1 1 1 1 1 1 1 1 1 1 . .
                    . . . 3 3 3 3 3 1 1 1 1 1 1 . .
                    . . . 2 2 2 2 2 3 1 1 1 1 2 . .
                    . . . . . . . . . 2 2 2 2 . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                    . . . . . . . . . . . . . . . .
                `, (s:wave)=>{
                    s.damage = 1
                    s.indeflectible = true
                })
                that.autoAttack(185, 0 ,()=>{
                    shoot(that, 180, 180, 1, 60, that.mySprite.x+d,that.mySprite.y,img`
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . 2 2 2 2 2 2 2 2 2 2 2 2 . .
                        . . 3 3 3 3 3 3 3 3 3 3 3 3 . .
                        . . 1 1 1 1 1 1 1 1 1 1 1 1 . .
                        . . 1 1 1 1 1 1 1 1 1 1 1 1 . .
                        . . 3 3 3 3 3 3 3 3 3 3 3 3 . .
                        . . 2 2 2 2 2 2 2 2 2 2 2 2 . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                        . . . . . . . . . . . . . . . .
                    `, (s:wave)=>{
                        s.damage = 1
                        s.indeflectible = true
                    })
                })
            })
            //=================== B键释放的技能 ===================
            setSkill(this, SkillKind.B, 0, (tempVar: tempVarDic, that: Character)=>{ //平A: B
                that.basicAttack('B')
            })

            setSkill(this, SkillKind.B1, 0, (tempVar: tempVarDic, that: Character)=>{ //反击: ⬇️+B
                that.basicAttack('B')
            })

            setSkill(this, SkillKind.B2, 0, (tempVar: tempVarDic, that: Character)=>{ //跳起攻击: ↑+B
                that.basicAttack('B')
            })

            setSkill(this, SkillKind.B3, 0, (tempVar: tempVarDic, that: Character)=>{ //跳起特殊攻击: ⬇️+↑+B
                let e = -5
                if(that.enemySprite.x > that.mySprite.x){
                    that.laspres = 1
                    e = -e
                }
                else that.laspres = 2
                that.mySprite.setPosition(that.enemySprite.x+e, that.enemySprite.y)
                that.basicAttack('B')
            })

            setSkill(this, SkillKind.B4, 0, (tempVar: tempVarDic, that: Character)=>{ //冲刺: ➡️➡️+B
                that.rushAttack('B')
            })

            setSkill(this, SkillKind.B6, 0, (tempVar: tempVarDic, that: Character)=>{ //冲跳攻: ➡️➡️+↑+B
                that.rushAttack('B')
            })

            setSkill(this, SkillKind.B8, 0, (tempVar: tempVarDic, that: Character)=>{ //平A2: ➡️+B
                that.rushAttack('A') //'B'
                let x = that.laspres == 1 ? -15 : 15
                let j = x
                let u = 0
                for(let index2 = 0; index2 < 3; index2++){
                    setTimeout(()=>{
                        shoot(that, 180,180,1,0,that.mySprite.x+x,that.mySprite.y,img`
                            . . . . . . . . . . . . . . . .
                            . . . . . . . . . . . . . . . .
                            . . . . . 4 4 4 4 4 . . . . . .
                            . . . 4 4 4 5 5 5 d 4 4 4 4 . .
                            . . 4 d 5 d 5 5 5 d d d 4 4 . .
                            . . 4 5 5 1 1 1 d d 5 5 5 4 . .
                            . 4 5 5 5 1 1 1 5 1 1 5 5 4 4 .
                            . 4 d d 1 1 5 5 5 1 1 5 5 d 4 .
                            . 4 5 5 1 1 5 1 1 5 5 d d d 4 .
                            . 2 5 5 5 d 1 1 1 5 1 1 5 5 2 .
                            . 2 d 5 5 d 1 1 1 5 1 1 5 5 2 .
                            . . 2 4 d d 5 5 5 5 d d 5 4 . .
                            . . . 2 2 4 d 5 5 d d 4 4 . . .
                            . . 2 2 2 2 2 4 4 4 2 2 2 . . .
                            . . . 2 2 4 4 4 4 4 4 2 2 . . .
                            . . . . . 2 2 2 2 2 2 . . . . .
                        `,(s)=>{
                            let pro = sprites.createProjectileFromSprite(img`
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                            `, s, 0, 0)
                            s.lifespan = 600
                            s.hurted = 4
                            s.breakdef = true
                            s.yspeed = 120
                            s.xspeed = 80
                            s.indeflectible = true
                            pro.lifespan = 600
                            animation.runImageAnimation(pro, [img`
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . . . . 4 4 4 4 4 . . . . . .
                                . . . 4 4 4 5 5 5 d 4 4 4 4 . .
                                . . 4 d 5 d 5 5 5 d d d 4 4 . .
                                . . 4 5 5 1 1 1 d d 5 5 5 4 . .
                                . 4 5 5 5 1 1 1 5 1 1 5 5 4 4 .
                                . 4 d d 1 1 5 5 5 1 1 5 5 d 4 .
                                . 4 5 5 1 1 5 1 1 5 5 d d d 4 .
                                . 2 5 5 5 d 1 1 1 5 1 1 5 5 2 .
                                . 2 d 5 5 d 1 1 1 5 1 1 5 5 2 .
                                . . 2 4 d d 5 5 5 5 d d 5 4 . .
                                . . . 2 2 4 d 5 5 d d 4 4 . . .
                                . . 2 2 2 2 2 4 4 4 2 2 2 . . .
                                . . . 2 2 4 4 4 4 4 4 2 2 . . .
                                . . . . . 2 2 2 2 2 2 . . . . .
                            `,img`
                                . . . . 2 2 2 2 2 2 2 2 . . . .
                                . . . 2 4 4 4 5 5 4 4 4 2 2 2 .
                                . 2 2 5 5 d 4 5 5 5 4 4 4 4 2 .
                                . 2 4 5 5 5 5 d 5 5 5 4 5 4 2 2
                                . 2 4 d d 5 5 5 5 5 5 d 4 4 4 2
                                2 4 5 5 d 5 5 5 d d d 5 5 5 4 4
                                2 4 5 5 4 4 4 d 5 5 d 5 5 5 4 4
                                4 4 4 4 . . 2 4 5 5 . . 4 4 4 4
                                . . b b b b 2 4 4 2 b b b b . .
                                . b d d d d 2 4 4 2 d d d d b .
                                b d d b b b 2 4 4 2 b b b d d b
                                b d d b b b b b b b b b b d d b
                                b b d 1 1 3 1 1 d 1 d 1 1 d b b
                                . . b b d d 1 1 3 d d 1 b b . .
                                . . 2 2 4 4 4 4 4 4 4 4 2 2 . .
                                . . . 2 2 4 4 4 4 4 2 2 2 . . .
                            `,img`
                                . . . . . . . . b b . . . . . .
                                . . . . . . . . b b . . . . . .
                                . . . b b b . . . . . . . . . .
                                . . b d d b . . . . . . . b b .
                                . b d d d b . . . . . . b d d b
                                . b d d b . . . . b b . b d d b
                                . b b b . . . . . b b . . b b .
                                . . . . . . . . . . . . . . . .
                                . . . . . . . . . . . . . . . .
                                . . b b b d d d d d d b b b . .
                                . b d c c c b b b b c c d d b .
                                b d d c b . . . . . b c c d d b
                                c d d b b . . . . . . b c d d c
                                c b d d d b b . . . . b d d c c
                                . c c b d d d d b . c c c c c c
                                . . . c c c c c c . . . . . . .
                            `],200)
                        })
                        x += j
                    }, u)
                    u += 100
                }
            })

            setSkill(this, SkillKind.B9, 0, (tempVar: tempVarDic, that: Character)=>{ //反击2: ↘️+B
                that.basicAttack('A')
                shoot(that, 0,0,1,0,that.mySprite.x,that.mySprite.y,img`
                    ......88888888......
                    .....8999999998.....
                    ....891111111198....
                    ...891........198...
                    ..891..........198..
                    .891............198.
                    891..............198
                    891..............198
                    891..............198
                    891..............198
                    891..............198
                    891..............198
                    891..............198
                    891..............198
                    .891............198.
                    ..891..........198..
                    ...891........198...
                    ....891111111198....
                    .....8999999998.....
                    ......88888888......
                `,(s)=>{
                    s.damage = 10
                    s.indeflectible = true
                    s.rebound = true
                    s.lifespan = 300
                })
            })

            setSkill(this, SkillKind.B10, 0, (tempVar: tempVarDic, that: Character)=>{ //必杀: ⬇️+➡️+B
                that.rushAttack('B')
            })
        }
        //=================== A键释放的技能 ===================
        skill0A = {f: (tempVar: tempVarDic, that: Character)=>{ //平A: A
                that.basicAttack('A')
            }, mp: 0}

        skill1A = {f: (tempVar: tempVarDic, that: Character)=>{ //反击: ⬇️+A
                that.basicAttack('A')
            }, mp: 0}
        skill2A = {f: (tempVar: tempVarDic, that: Character)=>{ //跳起攻击: ↑+A
                that.basicAttack('A')
            }, mp: 0}

        skill3A = {f: (tempVar: tempVarDic, that: Character)=>{ //跳起特殊攻击: ⬇️+↑+A
                that.basicAttack('A')
            }, mp: 0}

        skill4A = {f: (tempVar: tempVarDic, that: Character)=>{ //冲刺: ➡️➡️+A
                that.rushAttack('A')
            }, mp: 0}

        skill6A = {f: (tempVar: tempVarDic, that: Character)=>{ //冲跳攻: ➡️➡️+↑+A
                that.rushAttack('A')
            }, mp: 0}

        skill8A = {f: (tempVar: tempVarDic, that: Character)=>{ //平A2: ➡️+A
                that.basicAttack('A')
            }, mp: 0}

        skill9A = {f: (tempVar: tempVarDic, that: Character)=>{ //反击2: ↘️+A
                that.basicAttack('A')
            }, mp: 0}

        skill10A = {f: (tempVar: tempVarDic, that: Character)=>{ //必杀: ⬇️+➡️+A
                that.rushAttack('A')
            }, mp: 0}

        skill11A = {f: (tempVar: tempVarDic, that: Character)=>{ //受身反击: 被击飞+↑+A
            }, mp: 0}
        //=================== B键释放的技能 ===================
        skill0B = {f: (tempVar: tempVarDic, that: Character)=>{ //平A: B
                that.basicAttack('B')
            }, mp: 0}

        skill1B = {f: (tempVar: tempVarDic, that: Character)=>{ //反击: ⬇️+B
                that.basicAttack('B')
            }, mp: 0}

        skill2B = {f: (tempVar: tempVarDic, that: Character)=>{ //跳起攻击: ↑+B
                that.basicAttack('B')
            }, mp: 0}

        skill3B = {f: (tempVar: tempVarDic, that: Character)=>{ //跳起特殊攻击: ⬇️+↑+B
                that.basicAttack('B')
            }, mp: 0}

        skill4B = {f: (tempVar: tempVarDic, that: Character)=>{ //冲刺: ➡️➡️+B
                that.rushAttack('B')
            }, mp: 0}

        skill6B = {f: (tempVar: tempVarDic, that: Character)=>{ //冲跳攻: ➡️➡️+↑+B
                that.rushAttack('B')
            }, mp: 0}

        skill8B = {f: (tempVar: tempVarDic, that: Character)=>{ //平A2: ➡️+B
                that.rushAttack('A') //'B'
            }, mp: 0}

        skill9B = {f: (tempVar: tempVarDic, that: Character)=>{ //反击2: ↘️+B
                that.basicAttack('A')
            }, mp: 0}

        skill10B = {f: (tempVar: tempVarDic, that: Character)=>{ //必杀: ⬇️+➡️+B
                that.rushAttack('B')
            }, mp: 0}

        skill11B = {f: (tempVar: tempVarDic, that: Character)=>{ //受身反击: 被击飞+↑+B
            }, mp: 0}
        //=================== 按键事件 ===================
        Adown () {
            if (this.attack != 0 || this.hurted > 0) {
                return
            }
            if(this.skill == 11){
                if(this.skill11A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill11A.mp
                this.skill = 0
                this.skill11A.f(new tempVarDic(), this)
            }
            else if(this.skill == 0){
                if(this.skill0A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill0A.mp
                this.skill0A.f(new tempVarDic(), this)
            }
            else if(this.skill == 1){
                if(this.skill1A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill1A.mp
                this.skill1A.f(new tempVarDic(), this)
            }
            else if(this.skill == 2){
                if(this.skill2A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill2A.mp
                this.skill2A.f(new tempVarDic(), this)
            }
            else if(this.skill == 3){
                if(this.skill3A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill3A.mp
                this.skill3A.f(new tempVarDic(), this)
            }
            else if(this.skill == 4){
                if(this.skill4A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill4A.mp
                this.skill = 0
                this.skill4A.f(new tempVarDic(), this)
            }
            else if(this.skill == 6){
                if(this.skill6A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill6A.mp
                this.skill = 2
                this.skill6A.f(new tempVarDic(), this)
            }
            else if(this.skill == 8){
                if(this.skill8A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill8A.mp
                this.skill8A.f(new tempVarDic(), this)
            }
            else if(this.skill == 9){
                if(this.skill9A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill9A.mp
                this.skill = 0
                this.skill9A.f(new tempVarDic(), this)
            }
            else if(this.skill == 10){
                if(this.skill10A.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill10A.mp
                this.skill = 0
                this.skill10A.f(new tempVarDic(), this)
            }
            else this.attack = 0
        }
        Bdown () {
            if (this.attack != 0 || this.hurted > 0) {
                return
            }
            if(this.skill == 11){
                if(this.skill11B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill11B.mp
                this.skill = 0
                this.skill11B.f(new tempVarDic(), this)
            }
            else if(this.skill == 0){
                if(this.skill0B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill0B.mp
                this.skill0B.f(new tempVarDic(), this)
            }
            else if(this.skill == 1){
                if(this.skill1B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill1B.mp
                this.skill1B.f(new tempVarDic(), this)
            }
            else if(this.skill == 2){
                if(this.skill2B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill2B.mp
                this.skill2B.f(new tempVarDic(), this)
            }
            else if(this.skill == 3){
                if(this.skill3B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill3B.mp
                this.skill3B.f(new tempVarDic(), this)
            }
            else if(this.skill == 4){
                if(this.skill4B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill4B.mp
                this.skill = 0
                this.skill4B.f(new tempVarDic(), this)
            }
            else if(this.skill == 6){
                if(this.skill6B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill6B.mp
                this.skill = 2
                this.skill6B.f(new tempVarDic(), this)
            }
            else if(this.skill == 8){
                if(this.skill8B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill8B.mp
                this.skill8B.f(new tempVarDic(), this)
            }
            else if(this.skill == 9){
                if(this.skill9B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill9B.mp
                this.skill = 0
                this.skill9B.f(new tempVarDic(), this)
            }
            else if(this.skill == 10){
                if(this.skill10B.mp > this.mpbar.value){
                    return
                }
                this.mpbar.value -= this.skill10B.mp
                this.skill = 0
                this.skill10B.f(new tempVarDic(), this)
            }
            else this.attack = 0
        }
        downdown () {
            if(this.attack == 2){
                clearInterval(this.attackclock)
                this.attackclock = -1
                this.stand()
            }
            if ((this.jump | this.defence | this.attack | this.hurted) != 0) {
                return
            }
            if (this.skill == 0 || this.skill == 8 || this.skill == 4) {
                this.skill = 1
            }
            clearTimeout(this.comboclock)
            this.comboclock = -1
            this.defence = 1
            this.move(this.walkspeed/2)
            if(this.rush == 1){
                this.rush = 0
                this.rightDOWN = this.rightDOWN == 3 ? -1 : 0
                this.leftDOWN = this.leftDOWN == 3 ? -1 : 0
            }
            animation.stopAnimation(animation.AnimationTypes.All, this.mySprite)
            this.mySprite.setImage(this.defenceimg.clone())
            if(this.laspres == 1){
                this.mySprite.image.flipX()
            }
        }
        downup () {
            if(this.attack == 2){
                return
            }
            setTimeout(()=>{
                if(this.defence == 1 && this.attack != 1){
                    this.stand()
                    if(this.skill == 1 || this.skill == 9 || this.skill == 10){
                        this.skill = 0
                    }
                }
            }, this.defencelas)

        }
        updown () {
            if (this.attack != 0 || this.hurted > 0 && this.hitoverST == 0) {
                return
            }
            if (this.jump == 0) {
                clearTimeout(this.comboclock)
                this.comboclock = -1
                if(this.skill == 0 || this.skill == 8){
                    this.skill = 2
                }
                else if(this.skill == 1 || this.skill == 9 || this.skill == 10){
                    this.skill = 3
                }
                else if(this.skill == 4){
                    this.skill = 6
                }
                if(this.defence == 1){
                    this.stand()
                }
                // 起跳后无法左右移动
                this.jump = 1
                this.stop()
                if (this.leftDOWN == 1 || this.leftDOWN == -1) {
                    this.mySprite.vx = -this.walkspeed
                } else if (this.rightDOWN == 1 || this.rightDOWN == -1) {
                    this.mySprite.vx = this.walkspeed
                }
                this.mySprite.vy = -this.jumpspeed
                this.toground(()=>{
                    this.jump = 0
                    this.skill = 0
                    if(this.hurted == 0)
                        this.move(this.walkspeed) //恢复控制
                    this.mySprite.vx = 0
                })
                this.clearcombo()
            }
        }

        rightdown(){
            if (this.jump != 0 || (this.attack | this.hurted) != 0
                || this.leftDOWN == 1 || this.leftDOWN == -1) {
                if(this.attack == 0){
                    this.laspres = 2
                }
                this.rightDOWN = 1
                clearTimeout(this.comboclock)
                this.comboclock = -1
                this.clearcombo(300)
                return
            }
            if (this.rush == 1) {
                if (this.mySprite.vx > 0) {
                    return
                }
                this.stand(true)
                this.mySprite.vx = 0
                this.skill = 0
            }
            else if(this.skill == 0){
                this.skill = 8
            }
            else if(this.skill == 1 || this.skill == 10){
                this.skill = 9
            }
            clearTimeout(this.comboclock)
            this.comboclock = -1
            this.laspres = 2
            if (this.combo == 1 && this.laspres == 2 && this.rightDOWN == 2 && this.defence != 1) {
                this.stop()
                this.mySprite.vx = this.rushspeed
                this.rush = 1
                this.skill = 4
                this.rightDOWN = 3
            }
            if(this.rightDOWN == 0){
                this.rightDOWN = 1
                this.clearcombo(this.defence == 0 ? 300 : 500)
            }
        }
        rightup(){
            if((this.leftDOWN == 1 || this.leftDOWN == -1) && this.attack == 0){
                this.laspres = 1
            }
            if(this.rightDOWN == 3){
                this.rightDOWN = this.rush == 1 ? 5 : 0
            }
            else if (this.rightDOWN == 1 || this.rightDOWN == -1 || this.rightDOWN == 2) {
                clearTimeout(this.comboclock)
                this.comboclock = -1
                this.clearcombo(300)
                if(this.skill == 8){
                    this.skill = 0
                }
                else if(this.skill == 9){
                    this.skill = 10
                }
                this.rightDOWN = this.rightDOWN == 1  ? 2 : 0
            }
        }
        leftdown(){
            if (this.jump != 0 || (this.attack | this.hurted) != 0
                || this.rightDOWN == 1 || this.rightDOWN == -1) {
                if(this.attack == 0){
                    this.laspres = 1
                }
                this.leftDOWN = 1
                clearTimeout(this.comboclock)
                this.comboclock = -1
                this.clearcombo(300)
                return
            }
            if (this.rush == 1) {
                if (this.mySprite.vx < 0) {
                    return
                }
                this.stand(true)
                this.mySprite.vx = 0
                this.skill = 0
            }
            else if(this.skill == 0){
                this.skill = 8
            }
            else if(this.skill == 1 || this.skill == 10){
                this.skill = 9
            }
            this.laspres = 1
            clearTimeout(this.comboclock)
            this.comboclock = -1
            if (this.combo == 1 && this.laspres == 1 && this.leftDOWN == 2 && this.defence != 1) {
                this.stop()
                this.mySprite.vx = 0 - this.rushspeed
                this.rush = 1
                this.skill = 4
                this.leftDOWN = 3
            }
            if(this.leftDOWN == 0){
                this.leftDOWN = 1
                this.clearcombo(this.defence == 0 ? 300 : 500)
            }
        }
        //                        |->timeout(0)
        // 0 -> leftdown(1) -> leftup(2) -> leftdown(3.rush) -> leftup(5.rush)
        //        |->timeout(-1) -> leftup(0)
        leftup(){
            if((this.rightDOWN == 1 || this.rightDOWN == -1) && this.attack == 0){
                this.laspres = 2
            }
            if(this.leftDOWN == 3){
                this.leftDOWN = this.rush == 1 ? 5 : 0
            }
            else if (this.leftDOWN == 1 || this.leftDOWN == -1 || this.leftDOWN == 2) {
                clearTimeout(this.comboclock)
                this.comboclock = -1
                this.clearcombo(300)
                if(this.skill == 8){
                    this.skill = 0
                }
                else if(this.skill == 9){
                    this.skill = 10
                }
                this.leftDOWN = this.leftDOWN == 1  ? 2 : 0
            }
        }
        clearcombo (t = 500) {
            // 连击准备，t ms后清除
            this.combo = 1
            this.comboclock = setTimeout(()=>{
                this.comboclock = -1
                this.combo = 0
                if(this.skill == 9 || this.skill == 10){
                    this.skill = this.defence == 1 ? 1 : 0
                }
                else if(this.skill == 8){
                    this.skill = 0
                }
                this.leftDOWN = (this.leftDOWN == 1 || this.leftDOWN == -1) ? -1 : 0
                this.rightDOWN = (this.rightDOWN == 1 || this.rightDOWN == -1) ? -1 : 0
            }, t)
        }
        //=================== 初始化 ===================
        statusbar: StatusBarSprite
        mpbar: StatusBarSprite
        constructor(public mySprite: Sprite, public player: controller.Controller, public bulletkind: number){
            if(player == controller.player1){
                this.laspres = 2
            }
            else{
                this.laspres = 1
            }
            this.mySprite.setFlag(SpriteFlag.Ghost, true)
            this.mySprite.setFlag(SpriteFlag.Invisible, true);
            (<wave>(this.mySprite)).own = this
            this.statusbar = statusbars.create(50, 4, StatusBarKind.Health)
            this.statusbar.positionDirection(CollisionDirection.Top)
            this.statusbar.setOffsetPadding(-66666, 0)
            this.statusbar.setColor(2, 13)
            this.statusbar.setBarBorder(1, 11)
            this.mpbar = statusbars.create(50, 4, StatusBarKind.Health)
            this.mpbar.setColor(9, 5)
            this.mpbar.setBarBorder(1, 11)
            this.mpbar.positionDirection(CollisionDirection.Top)
            this.mpbar.setOffsetPadding(-66666, 3)
            this.standard = this.mySprite.image.clone()
            this.rstandard = this.mySprite.image.clone()
            this.rstandard.flipX()
        }
        walkInterval = 200
        startusbarsOffset = 53
        startcontroll(){
            this.mySprite.setFlag(SpriteFlag.Ghost, false)
            this.mySprite.setFlag(SpriteFlag.Invisible, false)
            this.statusbar.setOffsetPadding(this.startusbarsOffset, 0)
            this.mpbar.setOffsetPadding(this.startusbarsOffset, 0)
            let f = -1 //0: right, 1: left, -1: stop, -2: stop-left-anim, -3: stop-right-anim
            let wimg = <Image[]>[]
            for(let i = 0; i < this.walkimg.length; ++i){
                wimg.push(this.walkimg[i].clone())
                wimg[i].flipX()
            }
            setInterval(()=>{
                this.mpbar.value = Math.min(100, this.mpbar.value+100/Math.max(10, this.hp))
            }, 500)
            // setInterval(()=>{
            //     if(this.player == controller.player1)
            //     {
            //         console.log(this.attachBullet.length)
            //     }
            // }, 100)
            game.onUpdate(function() {
                if( (this.rightDOWN&1) == 1
                    && (this.hurted | this.jump | this.defence | this.attack) == 0){
                    if(f != 0){
                        f = 0
                        animation.stopAnimation(animation.AnimationTypes.All, this.mySprite)
                        animation.runImageAnimation(this.mySprite, this.walkimg, this.rush == 1 ? this.walkInterval*0.7 : this.walkInterval, true)
                    }
                }
                else if((this.leftDOWN&1) == 1
                    && (this.hurted | this.jump | this.defence | this.attack) == 0){
                    if(f != 1){
                        f = 1
                        animation.stopAnimation(animation.AnimationTypes.All, this.mySprite)
                        animation.runImageAnimation(this.mySprite, wimg, this.rush == 1 ? this.walkInterval*0.7 : this.walkInterval, true)
                    }
                }
                else{
                    if((this.hurted | this.attack | this.defence | this.jump) == 0){
                        if(this.laspres == 1){
                            if(this.standards != null){
                                if(f != -2){
                                    f = -2
                                    animation.stopAnimation(animation.AnimationTypes.All, this.mySprite)
                                    animation.runImageAnimation(this.mySprite, this.rstandards, this.rush == 1 ? this.walkInterval*0.7 : this.walkInterval, true)
                                }
                            }
                            else this.mySprite.setImage(this.rstandard)
                        }
                        else {
                            if(this.standards != null){
                                if(f != -3){
                                    f = -3
                                    animation.stopAnimation(animation.AnimationTypes.All, this.mySprite)
                                    animation.runImageAnimation(this.mySprite, this.standards, this.rush == 1 ? this.walkInterval*0.7 : this.walkInterval, true)
                                }
                            }
                            else this.mySprite.setImage(this.standard)
                        }
                    }
                    else f = -1
                    if(f >= 0){
                        animation.stopAnimation(animation.AnimationTypes.All, this.mySprite)
                        f = -1
                    }
                }
            })

            this.player.onButtonEvent(ControllerButton.Down, ControllerButtonEvent.Pressed, function () {
                this.downdown()
            })
            this.player.onButtonEvent(ControllerButton.Down, ControllerButtonEvent.Released, function () {
                this.downup()
            })
            this.player.onButtonEvent(ControllerButton.Up, ControllerButtonEvent.Pressed, function () {
                this.updown()
            })
            this.player.onButtonEvent(ControllerButton.Left, ControllerButtonEvent.Pressed, function () {
                this.leftdown()
            })
            this.player.onButtonEvent(ControllerButton.A, ControllerButtonEvent.Pressed, function () {
                this.Adown()
            })
            this.player.onButtonEvent(ControllerButton.Right, ControllerButtonEvent.Pressed, function () {
                this.rightdown()
            })
            this.player.onButtonEvent(ControllerButton.Left, ControllerButtonEvent.Released, function () {
                this.leftup()
            })
            this.player.onButtonEvent(ControllerButton.B, ControllerButtonEvent.Pressed, function () {
                this.Bdown()
            })
            this.player.onButtonEvent(ControllerButton.Right, ControllerButtonEvent.Released, function () {
                this.rightup()
            })
            this.player.moveSprite(this.mySprite, this.walkspeed, 0)
        }
    }

    function shoot(p: Character, beginAngel: number, endAngel: number, n: number, speed: number,
                   x: number, y: number, img: Image,
                   handle: (sprite: wave)=>void){
        let offset = Math.max(1, (endAngel-beginAngel)/n)
        beginAngel = (180+beginAngel)// % 360
        endAngel = (180+endAngel)// % 360
        for(let index = beginAngel; index <= endAngel; index += offset)
        {
            let bullet = <wave>sprites.createProjectileFromSide(img.clone(), 0, 0)
            reset(p, bullet)
            bullet.setPosition(x, y)
            bullet.setVelocity(speed*Math.cos(index/57.3), speed*Math.sin(index/57.3))
            if(p.laspres == 1){
                bullet.vx = -bullet.vx
                bullet.image.flipX()
            }
            bullet.setKind(p.bulletkind)
            handle(bullet)
        }
    }
}