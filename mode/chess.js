'use strict';
mode.chess={
	canvasUpdates2:[],
	element:{
		card:{
			moveTo:function(player,method){
				this.fixed=true;
				if(this.parentNode==ui.arena){
					var rect=player.getBoundingClientRect();
					this.style.left=(rect.left+8)+'px';
					this.style.top=(rect.top+8)+'px';
				}
				else{
					this.style.left='';
					this.style.top='';
					this.dataset.position=player.dataset.position;
				}
				if(method=='flip'){
					this.style.transition='all 0.5s';
					this.style.webkitTransform='rotate'+(Math.random()<0.5?'X':'Y')+'(180deg) perspective(1000px)';
				}
				else if(method=='rotate'){
					this.style.transition='all 0.5s';
					this.style.webkitTransform='rotate(180deg)';
				}
				return this;
			},
		},
		player:{
			createRangeShadow:function(num,move){
				num++;
				var shadows=this.parentNode.getElementsByClassName('playergrid');
				while(shadows.length){
					shadows[0].remove();
				}
				for(var i=1-num;i<num;i++){
					for(var j=1-num+Math.abs(i);j<num-Math.abs(i);j++){
						if(this.movable(i,j)){
							var grid=ui.create.playergrid(this,i,j);
							if(move){
								grid.listen(ui.click.playergrid);
								ui.movegrids.push(grid);
							}
							else{
								grid.classList.add('temp');
							}
						}
					}
				}
			},
			chooseToMove:function(num){
				var next=game.createEvent('chooseToMove');
				next.num=num||1;
				next.player=this;
				next.content=lib.element.playerproto.chooseToMove;
				return next;
			},
			move:function(x,y){
				var xy=this.getXY();
				return this.moveTo(x+xy[0],y+xy[1]);
			},
			moveTo:function(x,y){
				if(x>=ui.chesswidth){
					x=ui.chesswidth-1;
				}
				if(y>=ui.chessheight){
					y=ui.chessheight-1;
				}
				// console.log(x,y);

				var pos=y*ui.chesswidth+x;
				if(!lib.posmap[pos]){
					delete lib.posmap[this.dataset.position];
					this.dataset.position=pos;
					lib.posmap[pos]=this;
					this.chessFocus();
				}
				return this;
			},
			chessFocus:function(){
				if(ui.chess._chessdrag) return;
				var player=this;
				var dx=0,dy=0;

				if(player.offsetLeft-ui.chessContainer.scrollLeft<14){
					dx=player.offsetLeft-ui.chessContainer.scrollLeft-14;
				}
				else if(player.offsetLeft-ui.chessContainer.scrollLeft>ui.chessContainer.offsetWidth-134){
					dx=player.offsetLeft-ui.chessContainer.scrollLeft-ui.chessContainer.offsetWidth+134;
				}
				if(player.offsetTop-ui.chessContainer.scrollTop<14){
					dy=player.offsetTop-ui.chessContainer.scrollTop-14;
				}
				else if(player.offsetTop+ui.chess.offsetTop-ui.chessContainer.scrollTop>ui.chessContainer.offsetHeight-134){
					dy=player.offsetTop+ui.chess.offsetTop-ui.chessContainer.scrollTop-ui.chessContainer.offsetHeight+134;
				}
				if(_status.currentChessFocus){
					clearInterval(_status.currentChessFocus);
				}
				var count=12;
				var ddx=Math.floor(dx/12);
				var ddy=Math.floor(dy/12);
				if(dx||dy){
					_status.currentChessFocus=setInterval(function(){
						if(count--){
							ui.chessContainer.scrollLeft+=ddx;
							ui.chessContainer.scrollTop+=ddy;
						}
						else{
							ui.chessContainer.scrollLeft+=dx%12;
							ui.chessContainer.scrollTop+=dy%12;
							clearInterval(_status.currentChessFocus);
							delete _status.currentChessFocus;
						}
					},16);
				}
			},
			getXY:function(){
				var pos=parseInt(this.dataset.position);
				var x=pos%ui.chesswidth;
				var y=Math.floor(pos/ui.chesswidth);
				return [x,y];
			},
			getDataPos:function(x,y){
				var xy=this.getXY();
				if(typeof x!='number') x=0;
				if(typeof y!='number') y=0;
				x+=xy[0];
				y+=xy[1];
				return x+y*ui.chesswidth;
			},
			getNeighbour:function(x,y){
				return lib.posmap[this.getDataPos(x,y)]||null;
			},
			movable:function(x,y){
				var xy=this.getXY();
				if(xy[0]+x<0) return false;
				if(xy[1]+y<0) return false;
				if(xy[0]+x>=ui.chesswidth) return false;
				if(xy[1]+y>=ui.chessheight) return false;
				return !this.getNeighbour(x,y);
			},
			moveRight:function(){
				if(this.movable(1,0)){
					this.move(1,0);
					return true;
				}
				return false;
			},
			moveLeft:function(){
				if(this.movable(-1,0)){
					this.move(-1,0);
					return true;
				}
				return false;
			},
			moveUp:function(){
				if(this.movable(0,-1)){
					this.move(0,-1);
					return true;
				}
				return false;
			},
			moveDown:function(){
				if(this.movable(0,1)){
					this.move(0,1);
					return true;
				}
				return false;
			},
			dieAfter:function(source){
				var player=this;
				delete lib.posmap[player.dataset.position];
				setTimeout(function(){
					player.delete();
				},500);
				for(var i=0;i<ui.phasequeue.length;i++){
					if(ui.phasequeue[i].link==player){
						ui.phasequeue[i].remove();
						ui.phasequeue.splice(i,1);
						break;
					}
				}
				for(var i=1;i<game.players.length;i++){
					if(game.players[i].side!=game.players[0].side){
						if(source&&source.side!=player.side){
							source.draw();
						}
						return;
					}
				}
				game.over(game.me.side==game.players[0].side);
			},
			$draw:function(num){
				var cards,node;
				if(get.itemtype(num)=='cards'){
					cards=num;
					num=cards.length;
				}
				else if(get.itemtype(num)=='card'){
					cards=[num];
					num=1;
				}
				if(cards){
					cards=cards.slice(0);
					node=cards.shift().copy('drawing','thrown');
				}
				else{
					node=ui.create.div('.card.drawing.thrown');
				}
				node.fixed=true;
				game.$randomMove(this,node,100,30);
				node.dataset.position=this.dataset.position;
				this.parentNode.appendChild(node);
				ui.refresh(node);
				node.style.webkitTransform='';
				setTimeout(function(){
					node.remove();
				},1000);
				var that=this;
				if(num&&num>1){
					if(cards){
						that.$draw(cards)
					}
					else{
						that.$draw(num-1)
					}
				}
			},
			$gainmod:function(num){
				var cards,node;
				if(get.itemtype(num)=='cards'){
					cards=num;
					num=cards.length;
				}
				else if(get.itemtype(num)=='card'){
					cards=[num];
					num=1;
				}
				if(cards){
					cards=cards.slice(0);
					node=cards.shift().copy('thrown','hidden');
				}
				else{
					node=ui.create.div('.card.thrown.hidden');
				}
				node.fixed=true;
				game.$randomMove(this,node,100,30);
				var ot=node.style.webkitTransform;
				node.style.webkitTransform+='scale(0.6)';
				node.dataset.position=this.dataset.position;
				this.parentNode.appendChild(node);
				ui.refresh(node);
				node.show();
				node.style.webkitTransform=ot;
				setTimeout(function(){
					node.style.webkitTransform='';
					node.delete();
				},500);
				var that=this;
				if(num&&num>1){
					if(cards){
						that.$gain(cards)
					}
					else{
						that.$gain(num-1)
					}
				}
			},
			$throw:function(card,time){
				this.chessFocus();
				if(get.itemtype(card)=='cards'){
					for(var i=0;i<card.length;i++){
						this.$throw(card[i],time);
					}
				}
				else{
					if(card==undefined||card.length==0) return;
					var node=card.copy('thrown','hidden');
					node.dataset.position=this.dataset.position;
					this.parentNode.appendChild(node);
					ui.refresh(node);
					node.show();
					game.$randomMove(this,node,100,30);
					if(time!=undefined){
						node.fixed=true;
						setTimeout(function(){node.delete()},time);
					}
				}
			},
			$givemod:function(card,player){
				this.chessFocus();
				var from=this;
				if(get.itemtype(card)=='cards'){
					for(var i=0;i<card.length;i++){
						from.$givemod(card[i],player);
					}
				}
				else if(typeof card=='number'&&card>=0){
					for(var i=0;i<card;i++){
						from.$givemod('',player);
					}
				}
				else{
					var node;
					if(get.itemtype(card)=='card'){
						node=card.copy('card','thrown',false);
					}
					else{
						node=ui.create.div('.card.thrown');
					}

					node.dataset.position=this.dataset.position;
					node.fixed=true;
					node.hide();

					this.parentNode.appendChild(node);
					ui.refresh(node);
					node.show();

					game.$randomMove(this,node,100,30);

					setTimeout(function(){
						node.removeAttribute('style');
						node.dataset.position=player.dataset.position;
						node.delete();
					},700);
				}
			},
			$throwxy:function(card,left,top,transform){
				var node=card.copy('thrown');
				var rect=this.getBoundingClientRect();
				node.style.left=(rect.left+8)+'px';
				node.style.top=(rect.top+8)+'px';
				node.hide();
				node.style.transitionProperty='left,top,opacity';
				if(transform){
					node.style.webkitTransform='rotate('+(Math.random()*16-8)+'deg)';
				}
				ui.arena.appendChild(node);
				ui.refresh(node);
				node.show();
				node.style.left=left;
				node.style.top=top;
				return node;
			},
			$phaseJudge:function(card){
				var clone=card.copy('thrown',this.parentNode).animate('judgestart');
				var player=this;
				clone.style.opacity=0.6;
				clone.style.left=(Math.random()*100-50+ui.chessContainer.scrollLeft+ui.chessContainer.offsetWidth/2-52)+'px';
				clone.style.top=(Math.random()*80-40+ui.chessContainer.scrollTop+ui.chessContainer.offsetHeight/2-52-ui.chessContainer.offsetTop)+'px';
				game.delay();
				game.linexy([
					clone.offsetLeft+clone.offsetWidth/2,
					clone.offsetTop+clone.offsetHeight/2,
					player.offsetLeft+player.offsetWidth/2,
					player.offsetTop+player.offsetHeight/2
				],{opacity:0.5,dashed:true},true);
			}
		},
		playerproto:{
			chooseToMove:function(){
				"step 0"
				event.switchToAuto=function(){
					if(ui.movegrids){
						while(ui.movegrids.length){
							ui.movegrids.shift().delete();
						}
					}
					var list=[];
					var randomMove=['moveUp','moveDown','moveLeft','moveRight'];
					for(var iwhile=0;iwhile<num;iwhile++){
						var targets=[];
						for(var i=0;i<game.players.length;i++){
							if(game.players[i].side!=player.side){
								targets.push(game.players[i]);
							}
						}
						targets.sort(function(a,b){
							return get.distance(player,a)-get.distance(player,b);
						});
						while(targets.length){
							var target=targets.shift();
							var txy=target.getXY();
							var pxy=player.getXY();
							if(Math.random()<0.5){
								if(txy[0]>pxy[0]&&randomMove.contains('moveRight')){
									if(player.moveRight()){
										event.moved=true;break;
									}
								}
								else if(txy[0]<pxy[0]&&randomMove.contains('moveLeft')){
									if(player.moveLeft()){
										event.moved=true;break;
									}
								}
								if(txy[1]>pxy[1]&&randomMove.contains('moveDown')){
									if(player.moveDown()){
										event.moved=true;break;
									}
								}
								else if(txy[1]<pxy[1]&&randomMove.contains('moveUp')){
									if(player.moveUp()){
										event.moved=true;break;
									}
								}
							}
							else{
								if(txy[1]>pxy[1]&&randomMove.contains('moveDown')){
									if(player.moveDown()){
										event.moved=true;break;
									}
								}
								else if(txy[1]<pxy[1]&&randomMove.contains('moveUp')){
									if(player.moveUp()){
										event.moved=true;break;
									}
								}
								if(txy[0]>pxy[0]&&randomMove.contains('moveRight')){
									if(player.moveRight()){
										event.moved=true;break;
									}
								}
								else if(txy[0]<pxy[0]&&randomMove.contains('moveLeft')){
									if(player.moveLeft()){
										event.moved=true;break;
									}
								}
							}
							if(targets.length==0){
								if(randomMove.length){
									var list=randomMove.slice(0);
									var randomMoved=false;
									while(list.length){
										var thismove=list.randomRemove();
										if(player[thismove]()){
											event.moved=true;
											switch(thismove){
												case 'moveUp':randomMove.remove('moveDown');break;
												case 'moveDown':randomMove.remove('moveUp');break;
												case 'moveLeft':randomMove.remove('moveRight');break;
												case 'moveRight':randomMove.remove('moveLeft');break;
											}
											break;
										}
									}
									if(!event.moved) return;
								}
								else{
									return;
								}
							}
						}
						if(lib.skill._chessmove.ai.result.player(player)<=0) break;
					}
				};
				if(event.isMine()){
					event.control=ui.create.control('取消',function(){
						if(ui.movegrids){
							while(ui.movegrids.length){
								ui.movegrids.shift().delete();
							}
						}
						event.result='cancelled';
						game.resume();
					});
					game.pause();
					ui.movegrids=[];
					player.createRangeShadow(num,true);
					for(var i=0;i<ui.movegrids.length;i++){
						var grid=ui.movegrids[i];
						if(game.isChessNeighbour(grid,player)) continue;
						for(var j=0;j<ui.movegrids.length;j++){
							if(game.isChessNeighbour(grid,ui.movegrids[j])) break;
						}
						if(j==ui.movegrids.length) grid.remove();
					}
				}
				else{
					event.switchToAuto();
				}
				"step 1"
				if(event.moved){
					game.delay();
				}
				if(event.control){
					event.control.close();
				}
				ui.create.confirm();
			}
		}
	},
	game:{
		minskin:true,
		singleHandcard:true,
		isChessNeighbour:function(a,b){
			if(a&&a.dataset){
				a=a.dataset.position;
			}
			if(b&&b.dataset){
				b=b.dataset.position;
			}
			var ax=a%ui.chesswidth;
			var ay=Math.floor(a/ui.chesswidth);

			var bx=b%ui.chesswidth;
			var by=Math.floor(b/ui.chesswidth);

			if(ax==bx&&Math.abs(ay-by)==1) return true;
			if(ay==by&&Math.abs(ax-bx)==1) return true;

			return false;
		},
		$randomMove:function(player,node,length,rand){
			length=length+Math.random()*rand;
			var ang=Math.random()*360;
			ang*=Math.PI/180;
			var tx=length*Math.cos(ang);
			var ty=length*Math.sin(ang);
			var rect=player.getBoundingClientRect();
			if(rect.left<=80){
				tx=Math.abs(tx);
			}
			else if(rect.left+rect.width+80>=ui.chessContainer.offsetWidth){
				tx=-Math.abs(tx);
			}
			if(rect.top<=80){
				ty=Math.abs(ty);
			}
			else if(rect.top+rect.height+80>=ui.chessContainer.offsetHeight){
				ty=-Math.abs(ty);
			}
			node.style.webkitTransform='translate('+tx+'px,'+ty+'px)';
		},
		draw2:function(func){
			lib.canvasUpdates2.push(func);
			if(!lib.status.canvas2){
				lib.status.canvas2=true;
				game.update(game.updateCanvas2);
			}
		},
		updateCanvas2:function(time){
			if(lib.canvasUpdates2.length===0){
				lib.status.canvas2=false;
				return false;
			}
			ui.canvas2.width=ui.chess.offsetWidth;
			ui.canvas2.height=ui.chess.offsetHeight;
			ui.canvas2.style.left=0;
			ui.canvas2.style.top=0;
			var ctx=ui.ctx2;
			ctx.shadowBlur=5;
			ctx.shadowColor='rgba(0,0,0,0.3)';
			ctx.fillStyle='white';
			ctx.strokeStyle='white';
			ctx.lineWidth=3;
			ctx.save();
			for(var i=0;i<lib.canvasUpdates2.length;i++){
				ctx.restore();
				ctx.save();
				var update=lib.canvasUpdates2[i];
				if(!update.starttime){
					update.starttime=time;
				}
				if(update(time-update.starttime,ctx)===false){
					lib.canvasUpdates2.splice(i--,1);
				}
			}
		},
		start:function(){
			var next=game.createEvent('game',false);
			next.content=function(){
				"step 0"
				for(i in lib.skill){
					if(lib.skill[i].changeSeat){
						lib.skill[i]={};
						if(lib.translate[i+'_info']){
							lib.translate[i+'_info']='此模式下不可用';
						}
					}
				}
				lib.init.css('layout/mode','chess');
				ui.chesssheet=document.createElement('style');
				document.head.appendChild(ui.chesssheet);
				ui.create.arena();
				ui.chessContainer=ui.create.div('#chess-container',ui.arena);
				ui.chess=ui.create.div('#chess',ui.chessContainer);
				ui.canvas2=document.createElement('canvas');
				ui.chess.appendChild(ui.canvas2);
				ui.ctx2=ui.canvas2.getContext('2d');
				game.me=ui.create.player();
				game.chooseCharacter();
				"step 1"
				ui.arena.classList.add('chess');
				var num=get.config('battle_number');
				var double=get.config('double_character');
				var friend,enemy;
				var side=Math.random()<0.5;
				switch(num){
					case 2:ui.chessheight=5;break;
					case 3:ui.chessheight=5;break;
					case 4:ui.chessheight=6;break;
					case 6:ui.chessheight=7;break;
					case 8:ui.chessheight=8;break;
				}
				ui.chesswidth=Math.round(ui.chessheight*1.5);
				ui.chess.style.height=148*ui.chessheight+'px';
				ui.chess.style.width=148*ui.chesswidth+'px';
				ui.chess.addEventListener('mousedown',function(e){
					if(Array.isArray(e.path)){
						for(var i=0;i<e.path.length;i++){
							var itemtype=get.itemtype(e.path[i]);
							if(itemtype=='button'||itemtype=='card'||itemtype=='player'){
								return;
							}
						}
					}
					this._chessdrag=[e,this.parentNode.scrollLeft,this.parentNode.scrollTop];
				});
				ui.chess.addEventListener('mouseleave',function(e){
					this._chessdrag=null;
				});
				ui.chess.addEventListener('mouseup',function(e){
					if(this._chessdrag){
						this._chessdrag=null;
					}
				});
				ui.chess.addEventListener('mousemove',function(e){
					if(this._chessdrag){
						this.parentNode.scrollLeft=this._chessdrag[1]-e.x+this._chessdrag[0].x;
						this.parentNode.scrollTop=this._chessdrag[2]-e.y+this._chessdrag[0].y;
					}
					e.preventDefault();
				});
				ui.chessContainer.addEventListener('mousewheel',function(e){
					if(_status.currentChessFocus){
						clearInterval(_status.currentChessFocus);
						delete _status.currentChessFocus;
					}
				});

				for(var i=0;i<ui.chesswidth;i++){
					for(var j=0;j<ui.chessheight;j++){
						var pos='[data-position="'+(i+j*ui.chesswidth)+'"]';
						ui.chesssheet.sheet.insertRule('#arena.chess #chess>.player'+pos+
						'{left:'+(14+i*148)+'px;top:'+(14+j*148)+'px}',0);
						ui.chesssheet.sheet.insertRule('#arena.chess #chess>.card'+pos+
						'{left:'+(22+i*148)+'px;top:'+(22+j*148)+'px}',0);
						if(j==ui.chessheight-1){
							ui.chesssheet.sheet.insertRule('#arena.chess #chess>.popup'+pos+
							'{left:'+(19+i*148)+'px;top:'+(-19+j*148)+'px}',0);
						}
						else{
							ui.chesssheet.sheet.insertRule('#arena.chess #chess>.popup'+pos+
							'{left:'+(19+i*148)+'px;top:'+(142+j*148)+'px}',0);
						}
					}
				}

				var grids=[];
				var gridnum=ui.chessheight*ui.chesswidth;
				for(var i=0;i<gridnum;i++){
					grids.push(i);
				}
				for(var i=0;i<num;i++){
					friend=ui.create.player().animate('start');
					enemy=ui.create.player().animate('start');

					if(double){
						friend.init(_status.mylist.shift(),_status.mylist.shift());
						enemy.init(_status.enemylist.shift(),_status.enemylist.shift());
					}
					else{
						friend.init(_status.mylist.shift());
						enemy.init(_status.enemylist.shift());
					}
					friend.side=side;
					enemy.side=!side;
					friend.setIdentity('friend');
					enemy.setIdentity('enemy');
					friend.node.identity.dataset.color=get.translation(side+'Color');
					enemy.node.identity.dataset.color=get.translation(!side+'Color');

					game.players.push(friend);
					game.players.push(enemy);

					ui.chess.appendChild(friend);
					ui.chess.appendChild(enemy);

					friend.dataset.position=grids.randomRemove();
					enemy.dataset.position=grids.randomRemove();

					lib.posmap[friend.dataset.position]=friend;
					lib.posmap[enemy.dataset.position]=enemy;
				}

				lib.setPopped(ui.create.system('查看手牌',null,true),function(e){
					var uiintro=ui.create.dialog('hidden');

					for(var i=0;i<game.players.length;i++){
						if(game.players[i].side==game.me.side&&game.players[i]!=game.me){
							uiintro.add(get.translation(game.players[i]));
							var cards=game.players[i].get('h');
							if(cards.length){
								uiintro.add(cards,true);
							}
							else{
								uiintro.add('（无）');
							}
						}
					}

					return uiintro;
				});
				var clearPrompt=function(){
					for(var i=0;i<game.players.length;i++){
						game.players[i].unprompt();
					}
				};
				ui.create.system('显示距离',function(){
					if(!game.me.isAlive()) return;
					for(var i=0;i<game.players.length;i++){
						if(game.players[i]!=game.me){
							var dist=get.distance(game.me,game.players[i],'pure');
							if(dist>7){
								game.players[i].popup('距离：'+dist,'thunder');
							}
							else{
								game.players[i].popup('距离：'+dist);
							}
						}
					}
				},true);

				ui.create.me();
				ui.create.fakeme();
				ui.create.cards();

				ui.chessinfo=ui.create.div('.fakeme.player',ui.me);

				game.finishCards();
				game.arrangePlayers();
				"step 2"
				var p;
				for(var i=0;i<game.players.length;i++){
					if(game.players[i].side){
						p=game.players[i];
						break;
					}
				}
				game.gameDraw(p);
				game.phaseLoop(p);
				game.setChessInfo(p);
			}
		},
		setChessInfo:function(p){
			ui.chessinfo.innerHTML='';
			ui.phasequeue=[];
			for(var i=0;i<game.players.length;i++){
				var node=ui.create.div('.avatar',ui.chessinfo);
				node.style.backgroundImage=p.node.avatar.style.backgroundImage;
				node.link=p;
				node.listen(game.clickChessInfo);
				if(_status.currentPhase==p){
					node.classList.add('glow2');
				}
				ui.phasequeue.push(node);
				p=p.next;
			}
		},
		clickChessInfo:function(e){
			if(this.link.isAlive()){
				this.link.chessFocus();
				e.stopPropagation();
			}
		},
		chooseCharacter:function(){
			var next=game.createEvent('chooseCharacter',false);
			next.showConfig=true;
			next.ai=function(player,list){
				if(get.config('double_character')){
					player.init(list[0],list[1]);
				}
				else{
					player.init(list[0]);
				}
			}
			next.content=function(){
				"step 0"
				var i;
				var list=[];
				event.list=list;
				for(i in lib.character){
					if(lib.character[i][4]&&lib.character[i][4].contains('minskin')) continue;
					if(lib.config.forbidai.contains(i)) continue;
					if(lib.config.forbidall.contains(i)) continue;
					if(lib.config.forbidchess.contains(i)) continue;
					if(!get.config('double_character')&&get.config('ban_weak')&&lib.config.forbidsingle.contains(i)) continue;
					list.push(i);
				}
				list.randomSort();
				var dialog=ui.create.dialog('选择出场角色'+(get.config('double_character')?'（双将）':''));
				dialog.classList.add('fullwidth');
				dialog.classList.add('fullheight');
				dialog.add('0/'+(get.config('double_character')?2:1)*get.config('battle_number'));
				dialog.add([list.slice(0,get.config('battle_number')*4+5),'character']);
				ui.control.style.transition='all 0s';
				ui.control.style.top='calc(100% - 30px)';

				var next=game.me.chooseButton(dialog,true);
				next.selectButton=function(){
					return (get.config('double_character')?2:1)*get.config('battle_number');
				};
				next.custom.add.button=function(){
					if(ui.cheat2&&ui.cheat2.backup) return;
					_status.event.dialog.content.childNodes[0].innerHTML=
					'选择出场角色'+(get.config('double_character')?'（双将）':'');
					_status.event.dialog.content.childNodes[1].innerHTML=
					ui.selected.buttons.length+'/'+_status.event.selectButton();
				};
				event.changeDialog=function(){
					if(ui.cheat2&&ui.cheat2.dialog==_status.event.dialog){
						return;
					}
					list.randomSort();
					_status.event.dialog.close();
					_status.event.dialog=ui.create.dialog('选择出场角色'+(get.config('double_character')?'（双将）':''));
					_status.event.dialog.classList.add('fullwidth');
					_status.event.dialog.classList.add('fullheight');
					_status.event.dialog.add('0/'+(get.config('double_character')?2:1)*get.config('battle_number'));
					_status.event.dialog.add([list.slice(0,get.config('battle_number')*4+5),'character']);
					game.uncheck();
					game.check();
				};
				ui.create.cheat=function(){
					ui.cheat=ui.create.control('更换',event.changeDialog);
				};
				event.dialogxx=ui.create.characterDialog();
				event.dialogxx.classList.add('fullwidth');
				event.dialogxx.classList.add('fullheight');
				ui.create.cheat2=function(){
					ui.cheat2=ui.create.control('自由选将',function(){
						if(this.dialog==_status.event.dialog){
							this.dialog.close();
							_status.event.dialog=this.backup;
							this.backup.open();
							delete this.backup;
							game.uncheck();
							game.check();
							if(ui.cheat2x){
								ui.cheat2x.close();
								delete ui.cheat2x;
							}
						}
						else{
							ui.cheat2x=ui.create.groupControl(_status.event.parent.dialogxx);
							this.backup=_status.event.dialog;
							_status.event.dialog.close();
							_status.event.dialog=_status.event.parent.dialogxx;
							this.dialog=_status.event.dialog;
							this.dialog.open();
							game.uncheck();
							game.check();
						}
					});
				}
				if(!ui.cheat&&get.config('change_choice'))
				ui.create.cheat();
				if(!ui.cheat2&&get.config('free_choose'))
				ui.create.cheat2();
				"step 1"
				if(ui.cheat){
					ui.cheat.close();
					delete ui.cheat;
				}
				if(ui.cheat2){
					ui.cheat2.close();
					delete ui.cheat2;
				}
				if(ui.cheat2x){
					ui.cheat2x.close();
					delete ui.cheat2x;
				}

				ui.control.style.top='';
				ui.control.style.transition='';

				_status.mylist=result.links.slice(0);
				for(var i=0;i<result.links.length;i++){
					event.list.remove(result.links[i]);
				}
				event.list.randomSort();
				_status.enemylist=event.list.slice(0,result.links.length);
				_status.double_character=get.config('double_character');
			}
		},
		modeSwapPlayer:function(player){
			game.me.node.avatar.classList.remove('glow2');
			player.node.avatar.classList.add('glow2');
			game.swapControl(player);
			ui.create.fakeme();
		}
	},
	skill:{
		_noactpunish:{
			trigger:{player:'useCard'},
			filter:function(event,player){
				return _status.currentPhase==player&&event.targets&&(event.targets.length>1||event.targets[0]!=player);
			},
			forced:true,
			popup:false,
			content:function(){
				player.addTempSkill('noactpunish','phaseAfter');
			}
		},
		noactpunish:{},
		_phasequeue:{
			trigger:{player:'phaseBegin'},
			forced:true,
			popup:false,
			content:function(){
				var current=ui.chessinfo.querySelector('.glow2');
				if(current){
					current.classList.remove('glow2');
				}
				for(var i=0;i<ui.phasequeue.length;i++){
					if(ui.phasequeue[i].link==player){
						ui.phasequeue[i].classList.add('glow2');
						ui.chessinfo.scrollTop=ui.phasequeue[i].offsetTop-8;
						break;
					}
				}
			}
		},
		_chessmove:{
			enable:'phaseUse',
			usable:1,
			direct:true,
			delay:false,
			content:function(){
				"step 0"
				player.chooseToMove(player.skills.contains('noactpunish')?2:1);
				"step 1"
				if(result=='cancelled'){
					player.getStat().skill._chessmove--;
				}
			},
			ai:{
				order:5,
				result:{
					player:function(player){
						var range=get.attackRange(player)>1;
						var nh=player.num('h');
						if(!player.num('h','sha')&&
						!player.num('h','shunshou')&&
						!player.num('h','bingliang')){
							if(nh<=Math.min(3,player.hp)) return Math.random()-0.3;
							else if(nh<=Math.min(2,player.hp)) return Math.random()-0.4;
							return Math.random()-0.5;
						}
						var neighbour;
						neighbour=player.getNeighbour(0,1);
						if(neighbour&&neighbour.side!=player.side){
							return range?1:0;
						}
						neighbour=player.getNeighbour(0,-1);
						if(neighbour&&neighbour.side!=player.side){
							return range?1:0;
						}
						neighbour=player.getNeighbour(1,0);
						if(neighbour&&neighbour.side!=player.side){
							return range?1:0;
						}
						neighbour=player.getNeighbour(-1,0);
						if(neighbour&&neighbour.side!=player.side){
							return range?1:0;
						}
						return 1;
					}
				}
			}
		},
		_chessswap:{
			trigger:{player:['phaseBegin','chooseToUseBegin','chooseToRespondBegin','chooseToDiscardBegin','chooseToCompareBegin',
			'chooseButtonBegin','chooseCardBegin','chooseTargetBegin','chooseCardTargetBegin','chooseControlBegin',
			'chooseBoolBegin','choosePlayerCardBegin','discardPlayerCardBegin','gainPlayerCardBegin']},
			forced:true,
			priority:100,
			popup:false,
			filter:function(event,player){
				if(event.autochoose&&event.autochoose()) return false;
				return !_status.auto&&player.isUnderControl();
			},
			content:function(){
				game.modeSwapPlayer(player);
			},
		},
		_chesscenter:{
			trigger:{player:['phaseBegin','useCardBegin','useSkillBegin','respondBegin','damageBegin','loseHpBegin'],
			target:'useCardToBegin'},
			forced:true,
			priority:100,
			popup:false,
			content:function(){
				player.chessFocus();
			},
		},
	},
	translate:{
		friend:'友',
		enemy:'敌',
		trueColor:"zhu",
		falseColor:"wei",
		_chessmove:'移动',
	},
	ui:{
		create:{
			playergrid:function(player,x,y){
				var node=ui.create.div('.player.minskin.playergrid',player.parentNode);
				node.link=player;
				node.dataset.position=player.getDataPos(x,y);
				return node;
			},
			fakeme:function(){
				if(ui.fakeme){
					ui.fakeme.delete();
				}
				ui.fakeme=ui.create.div('.fakeme.avatar',ui.me);
				ui.fakeme.style.backgroundImage=game.me.node.avatar.style.backgroundImage;
			}
		},
		click:{
			playergrid:function(){
				if(!_status.paused) return;
				delete lib.posmap[this.link.dataset.position];
				this.link.dataset.position=this.dataset.position;
				lib.posmap[this.link.dataset.position]=this.link;
				if(ui.movegrids){
					while(ui.movegrids.length){
						ui.movegrids.shift().delete();
					}
				}
				game.resume();
			}
		}
	},
	ai:{
		get:{
			attitude:function(from,to){
				return (from.side==to.side?1:-1)*5;
			}
		}
	},
	posmap:{},
	help:{
		'战棋模式':'<ul><li>n人对战n人的模式，由单人控制，开始游戏后随机分配位置与出牌顺序<li>'+
		'每人在出牌阶段有一次移动的机会，若一名角色在移动之前使用过指定其他角色为目标的牌，该回合可移动的最大距离为2，否则最大距离为1<li>'+
		'任何卡牌或技能无法指定位置相隔8个格以上的角色为目标<li>'+
		'杀死对方阵营的角色可摸一张牌，杀死本方阵营无惩罚'
	},
	config:['battle_number','ban_weak','free_choose','change_choice'],
}
