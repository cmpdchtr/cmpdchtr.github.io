sunflower=function(x,y){
	this.x=Math.floor(x/gamefield.playgroundWidth)*gamefield.playgroundWidth;
	this.y=Math.floor(y/gamefield.playgroundHeight)*gamefield.playgroundHeight;
	this.start=Date.now();
	this.healt=6;
	snumb-=this.cost;
	this.suns=50;
	this.lastSun=Date.now();
	this.image = new Image();
	this.image.src="images/SunflowerHD.png";
};
sunflower.prototype={
	cost:25,
	draw:function(){
		context.drawImage(this.image,this.x,this.y,gamefield.playgroundWidth,gamefield.playgroundHeight);
	},
	checkGettingSun:function(){
		if(Date.now()-this.lastSun>=10000){
			suns.push(new Sun(this.x,this.y,this.suns));
			this.lastSun=Date.now();
		}
	}
};
peashooter=function(x,y){
	this.x=Math.floor(x/gamefield.playgroundWidth)*gamefield.playgroundWidth;
	this.y=Math.floor(y/gamefield.playgroundHeight)*gamefield.playgroundHeight;
	this.start=Date.now();
	this.healt=10;
	this.attack=1;
	this.lastShot=Date.now();
	snumb-=this.cost;
	this.image = new Image();
	this.image.src="images/PeashooterHD.png";
};
peashooter.prototype={
	cost:50,
	draw:function(){
		context.drawImage(this.image,this.x,this.y,gamefield.playgroundWidth,gamefield.playgroundHeight);
	},
	checkShot:function(){
		if(Date.now()-this.lastShot>=5000){	
			for( var j in zombies ){
				if(zombies[j].y==this.y){	
					shots.push(new Shot(this.x+2*gamefield.playgroundWidth/2,this.y+gamefield.playgroundHeight/2-16,5,0,this.attack));
					this.lastShot=Date.now();
					break;
				}
			}
		}
	}
};
walker=function(x,y){
	this.healt=3;
	this.x=x;
	this.y=y;
	this.dx=-0.5;
	this.dy=0;
	this.lastAttack=false;
	this.attack=1;
	this.image = new Image();
	this.image.src="images/ZombieHD.png";
};
walker.prototype={
	draw:function(){
		context.drawImage(this.image,this.x,this.y,gamefield.playgroundWidth,gamefield.playgroundHeight);
	},
	move:function(){
		this.x+=this.dx;
		this.y+=this.dy;
	},
	checkBite:function(){
		if(gamefield.gamefield[Math.floor(this.y/gamefield.playgroundHeight)][Math.floor(this.x/gamefield.playgroundWidth)]!=0){
			for(i in plants){
				var objective=plants[i];
				if(objective.y==this.y){					
					if(Math.floor(objective.x/40)==Math.floor(this.x/40)){
						if(this.lastAttack==false){
							this.lastAttack=Date.now()-1000;
						}
						if(Date.now()-this.lastAttack>=1000){
							objective.healt-=this.attack;
							this.lastAttack=Date.now();
							this.dx=0;
							if(objective.healt<=0){
								plants.splice(i,1);
								this.lastAttack=false;
								this.dx=-0.5;
							}
						}
					}
				}
			}
		}
	}
};
Shot=function(x,y,dx,dy,attack){
	this.range=5;
	this.x=x;
	this.y=y;
	this.dx=dx;
	this.dy=dy;
	this.attack=attack;	

};
Shot.prototype={
	draw:function(){
		context.beginPath();
		context.arc(this.x, this.y, this.range, 0, 2 * Math.PI, false);
		context.fillStyle = '#CA8123';
		context.fill();
	},
	move:function(){
		this.x+=this.dx;
		this.y+=this.dy;
	},
	checkColision:function(){
		for(var j in zombies){
			var objective=zombies[j];
			if((this.y-gamefield.playgroundHeight/2+16)==objective.y){
				if((this.x+this.range-16)>=objective.x){
					objective.healt-=this.attack;
					this.attack=0;
					if(objective.healt<=0){
						zombies.splice(j,1);
					}
					return true;
				}
			}
		}
		return false;
	}
};
Sun=function(x,y,sunS){
	this.suns=sunS;
	this.range=20;
	this.x=(x+gamefield.playgroundWidth/2);
	this.y=(y+this.range);
	this.dx=Math.random()*1-0.5;
	this.dy=Math.random()*1-0.5;
	this.startTime=Date.now();
	this.image = new Image();
	this.image.src="images/SunHD.png";
	this.rotation=0;
};
Sun.prototype={
	draw:function(){
		context.drawImage(this.image,this.x,this.y,this.range*2,this.range*2);
		
	},
	move:function(){
		var xCord=this.x;
		var yCord=this.y;
		this.x+=this.dx;
		this.rotation+=1/Math.PI;
		this.y+=this.dy;
		if(this.x-this.range<0){
			this.dx*=-1;
			this.x=this.range;
		}
		if((this.x+this.range>canvas.width)){
			this.dx*=-1;
			this.x=canvas.width-this.range;
		}
		if(this.y-this.range<0){
			this.dy*=-1;
			this.y=this.range;
		}
		if(this.y+this.range>canvas.height){
			this.dy*=-1;
			this.y=canvas.height-this.range;
		}
		this.dy-=this.dy*Math.random()/100;
		this.dx-=this.dx*Math.random()/100;
	},
	checkLife:function(){
		if(Date.now()-this.startTime>=8000){
			return true;
		}
		return false;
	}
};
wallnut=function(x,y){
	this.x=Math.floor(x/gamefield.playgroundWidth)*gamefield.playgroundWidth;
	this.y=Math.floor(y/gamefield.playgroundHeight)*gamefield.playgroundHeight;
	this.start=Date.now();
	this.healt=15;
	snumb-=this.cost;
	this.image = new Image();
	this.image.src="images/WallnutHD.png";
};
wallnut.prototype={
	cost:100,
	draw:function(){
		context.drawImage(this.image,this.x,this.y,gamefield.playgroundWidth,gamefield.playgroundHeight);
	},
	checkShot:function(){
		for( var i in zombies){
			var objective = zombies[i];
			if(objective.y==this.y){
				if(Date.now()-this.lastShot>7000){
					shots.push(new Shot2(this.x,this.y,objective,this.attack));
					this.lastShot=Date.now();
					break;
				}
			}
		}
	}
};