"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[5106],{5106:(T,h,s)=>{s.r(h),s.d(h,{EmployeeManagementPageModule:()=>O});var p=s(177),u=s(9417),i=s(4742),E=s(5563),m=s(467),U=s(8359),g=s(1985),f=s(7673),y=s(6354),_=s(9437),M=s(4843),e=s(4438),P=s(9011);function b(r,l){if(1&r){const a=e.RV6();e.j41(0,"ion-item")(1,"ion-label")(2,"h2"),e.EFF(3),e.k0s(),e.j41(4,"p"),e.EFF(5),e.k0s(),e.j41(6,"p"),e.EFF(7),e.k0s()(),e.j41(8,"ion-button",6),e.bIt("click",function(){const t=e.eBV(a).$implicit,o=e.XpG();return e.Njj(o.editUser(t))}),e.EFF(9,"Editar"),e.k0s()()}if(2&r){const a=l.$implicit;e.R7$(3),e.JRh(a.Name),e.R7$(2),e.JRh(a.Email),e.R7$(2),e.SpI("Rol: ",a.Role,"")}}function v(r,l){if(1&r){const a=e.RV6();e.j41(0,"ion-item")(1,"ion-label",11),e.EFF(2,"Nombre"),e.k0s(),e.j41(3,"ion-input",12),e.mxI("ngModelChange",function(t){e.eBV(a);const o=e.XpG(2);return e.DH7(o.editingUser.Name,t)||(o.editingUser.Name=t),e.Njj(t)}),e.k0s()()}if(2&r){const a=e.XpG(2);e.R7$(3),e.R50("ngModel",a.editingUser.Name)}}function C(r,l){if(1&r){const a=e.RV6();e.j41(0,"ion-item")(1,"ion-label",11),e.EFF(2,"Email"),e.k0s(),e.j41(3,"ion-input",13),e.mxI("ngModelChange",function(t){e.eBV(a);const o=e.XpG(2);return e.DH7(o.editingUser.Email,t)||(o.editingUser.Email=t),e.Njj(t)}),e.k0s()()}if(2&r){const a=e.XpG(2);e.R7$(3),e.R50("ngModel",a.editingUser.Email)}}function x(r,l){if(1&r){const a=e.RV6();e.j41(0,"ion-item")(1,"ion-label"),e.EFF(2,"Rol"),e.k0s(),e.j41(3,"ion-select",12),e.mxI("ngModelChange",function(t){e.eBV(a);const o=e.XpG(2);return e.DH7(o.editingUser.Role,t)||(o.editingUser.Role=t),e.Njj(t)}),e.j41(4,"ion-select-option",14),e.EFF(5,"Admin"),e.k0s(),e.j41(6,"ion-select-option",15),e.EFF(7,"Empleado"),e.k0s()()()}if(2&r){const a=e.XpG(2);e.R7$(3),e.R50("ngModel",a.editingUser.Role)}}function F(r,l){if(1&r){const a=e.RV6();e.j41(0,"ion-header")(1,"ion-toolbar")(2,"ion-title"),e.EFF(3,"Editar Usuario"),e.k0s(),e.j41(4,"ion-buttons",7)(5,"ion-button",8),e.bIt("click",function(){e.eBV(a);const t=e.XpG();return e.Njj(t.cancelEdit())}),e.EFF(6,"Cancelar"),e.k0s()()()(),e.j41(7,"ion-content",2),e.DNE(8,v,4,1,"ion-item",9)(9,C,4,1,"ion-item",9)(10,x,8,1,"ion-item",9),e.j41(11,"ion-button",10),e.bIt("click",function(){e.eBV(a);const t=e.XpG();return e.Njj(t.saveUser())}),e.EFF(12,"Guardar Cambios"),e.k0s()()}if(2&r){const a=e.XpG();e.R7$(8),e.Y8G("ngIf",a.editingUser),e.R7$(),e.Y8G("ngIf",a.editingUser),e.R7$(),e.Y8G("ngIf",a.editingUser)}}const j=[{path:"",component:(()=>{var r;class l{constructor(n,t,o,c){this.databaseService=n,this.toastController=t,this.loadingController=o,this.alertController=c,this.showToast=!1,this.toastMessage="",this.users=[],this.editingUser=null,this.subscriptions=new U.yU}ngOnInit(){this.loadUsers()}ngOnDestroy(){this.subscriptions.unsubscribe()}loadUsers(){var n=this;return(0,m.A)(function*(){const t=yield n.loadingController.create({message:"Cargando empleados..."});yield t.present();try{n.users=yield n.getAllUsers()}catch(o){console.error("Error al cargar empleados:",o),n.presentToast("Error al cargar empleados. Por favor, intente de nuevo.")}finally{yield t.dismiss()}})()}getAllUsers(){var n=this;return(0,m.A)(function*(){const t=n.databaseService.getAllUsers();if(t instanceof g.c)try{return yield(0,M._)(t.pipe((0,y.T)(c=>c||[]),(0,_.W)(()=>(0,f.of)([]))))}catch{return[]}return Promise.resolve(t||[])})()}addUser(){var n=this;return(0,m.A)(function*(){yield(yield n.alertController.create({header:"A\xf1adir Empleado",inputs:[{name:"name",type:"text",placeholder:"Nombre"},{name:"email",type:"email",placeholder:"Email"},{name:"password",type:"password",placeholder:"Contrase\xf1a"},{type:"radio",label:"Empleado",value:"employee",name:"role"},{type:"radio",label:"Admin",value:"admin",name:"role"},{type:"radio",label:"Manager",value:"manager",name:"role"}],buttons:[{text:"Cancelar",role:"cancel"},{text:"A\xf1adir",handler:o=>{n.createNewUser(o)}}]})).present()})()}createNewUser(n){var t=this;return(0,m.A)(function*(){if(!(n.name&&n.email&&n.password&&n.role))return void t.presentToast("Por favor, complete todos los campos");const o=yield t.loadingController.create({message:"A\xf1adiendo empleado..."});yield o.present();const c={Name:n.name,Email:n.email,Password:n.password,Role:n.role,Username:n.email};try{const d=yield t.createUser(c);if(void 0===d)throw new Error("No se pudo crear el usuario");c.UserID=d,t.users.push(c),t.presentToast("Empleado a\xf1adido con \xe9xito")}catch(d){console.error("Error al a\xf1adir empleado:",d),t.presentToast("Error al a\xf1adir empleado. Por favor, intente de nuevo.")}finally{yield o.dismiss()}})()}createUser(n){const t=this.databaseService.createUser(n);return t instanceof g.c?t.pipe((0,y.T)(o=>o),(0,_.W)(()=>(0,f.of)(void 0))).toPromise():Promise.resolve(t)}editUser(n){this.editingUser={...n}}saveUser(){var n=this;return(0,m.A)(function*(){if(!n.editingUser)return;const t=yield n.loadingController.create({message:"Guardando cambios..."});yield t.present();try{if(!(yield n.updateUser(n.editingUser)))throw new Error("No se pudo actualizar el usuario");{const c=n.users.findIndex(d=>d.UserID===n.editingUser.UserID);-1!==c&&(n.users[c]={...n.editingUser}),n.presentToast("Usuario actualizado con \xe9xito"),n.editingUser=null}}catch(o){console.error("Error al actualizar usuario:",o),n.presentToast("Error al actualizar usuario. Por favor, intente de nuevo.")}finally{yield t.dismiss()}})()}updateUser(n){const t=this.databaseService.updateUserFromDb(n);return t instanceof g.c?t.pipe((0,y.T)(()=>!0),(0,_.W)(()=>(0,f.of)(!1))).toPromise().then(o=>void 0!==o&&o):Promise.resolve(void 0!==t)}deleteUser(n){var t=this;return(0,m.A)(function*(){yield(yield t.alertController.create({header:"Confirmar eliminaci\xf3n",message:`\xbfEst\xe1 seguro de que desea eliminar a ${n.Name}?`,buttons:[{text:"Cancelar",role:"cancel"},{text:"Eliminar",handler:()=>{t.performUserDeletion(n)}}]})).present()})()}performUserDeletion(n){var t=this;return(0,m.A)(function*(){const o=yield t.loadingController.create({message:"Eliminando empleado..."});yield o.present();try{if(!(yield t.deleteUserFromDb(n.UserID)))throw new Error("No se pudo eliminar el usuario");t.users=t.users.filter(d=>d.UserID!==n.UserID),t.presentToast("Empleado eliminado con \xe9xito")}catch(c){console.error("Error al eliminar empleado:",c),t.presentToast("Error al eliminar empleado. Por favor, intente de nuevo.")}finally{yield o.dismiss()}})()}deleteUserFromDb(n){var t=this;return(0,m.A)(function*(){const o=t.databaseService.deleteUser(n);if(o instanceof g.c)try{return yield(0,M._)(o),!0}catch{return!1}return Promise.resolve(void 0!==o&&!1!==o)})()}presentToast(n){var t=this;return(0,m.A)(function*(){yield(yield t.toastController.create({message:n,duration:2e3,position:"top"})).present()})()}cancelEdit(){this.editingUser=null}}return(r=l).\u0275fac=function(n){return new(n||r)(e.rXU(P.B),e.rXU(i.K_),e.rXU(i.Xi),e.rXU(i.hG))},r.\u0275cmp=e.VBU({type:r,selectors:[["app-employee-management"]],decls:12,vars:5,consts:[["slot","start"],["defaultHref","/admin-dashboard"],[1,"ion-padding"],[4,"ngFor","ngForOf"],[3,"isOpen"],["position","top","color","primary",3,"isOpen","message","duration"],["slot","end",3,"click"],["slot","end"],[3,"click"],[4,"ngIf"],["expand","block",3,"click"],["position","floating"],[3,"ngModelChange","ngModel"],["type","Email",3,"ngModelChange","ngModel"],["value","admin"],["value","empleado"]],template:function(n,t){1&n&&(e.j41(0,"ion-header")(1,"ion-toolbar")(2,"ion-buttons",0),e.nrm(3,"ion-back-button",1),e.k0s(),e.j41(4,"ion-title"),e.EFF(5,"Gesti\xf3n de Empleados"),e.k0s()()(),e.j41(6,"ion-content",2)(7,"ion-list"),e.DNE(8,b,10,3,"ion-item",3),e.k0s(),e.j41(9,"ion-modal",4),e.DNE(10,F,13,3,"ng-template"),e.k0s()(),e.nrm(11,"ion-toast",5)),2&n&&(e.R7$(8),e.Y8G("ngForOf",t.users),e.R7$(),e.Y8G("isOpen",!!t.editingUser),e.R7$(2),e.Y8G("isOpen",t.showToast)("message",t.toastMessage)("duration",3e3))},dependencies:[p.Sq,p.bT,u.BC,u.vS,i.Jm,i.QW,i.W9,i.eU,i.$w,i.uz,i.he,i.nf,i.Nm,i.Ip,i.BC,i.op,i.ai,i.Sb,i.Je,i.Gw,i.el],styles:["[_nghost-%COMP%]{--ion-color-primary: #3880ff;--ion-color-secondary: #3dc2ff;--ion-color-tertiary: #5260ff;--ion-color-success: #2dd36f;--ion-color-warning: #ffc409;--ion-color-danger: #eb445a;--ion-color-medium: #92949c;--ion-color-light: #f4f5f8}ion-content[_ngcontent-%COMP%]{--background: var(--ion-color-light)}ion-list[_ngcontent-%COMP%]{background:transparent}ion-item[_ngcontent-%COMP%]{--background: #ffffff;border-radius:10px;margin-bottom:10px;box-shadow:0 2px 4px #0000001a}ion-item[_ngcontent-%COMP%]   ion-label[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:18px;font-weight:700;color:var(--ion-color-dark)}ion-item[_ngcontent-%COMP%]   ion-label[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-size:14px;color:var(--ion-color-medium)}ion-button[_ngcontent-%COMP%]{--border-radius: 10px}ion-modal[_ngcontent-%COMP%]{--background: var(--ion-color-light)}ion-modal[_ngcontent-%COMP%]   ion-content[_ngcontent-%COMP%]{--padding-top: 20px;--padding-bottom: 20px}ion-modal[_ngcontent-%COMP%]   ion-item[_ngcontent-%COMP%]{--background: #ffffff;--border-color: var(--ion-color-medium);--border-width: 1px;--border-style: solid;--border-radius: 10px;margin-bottom:15px}ion-modal[_ngcontent-%COMP%]   ion-button[expand=block][_ngcontent-%COMP%]{margin-top:20px}@keyframes _ngcontent-%COMP%_fadeInUp{0%{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}ion-item[_ngcontent-%COMP%], ion-button[_ngcontent-%COMP%]{animation:_ngcontent-%COMP%_fadeInUp .3s ease-out}"]}),l})()}];let R=(()=>{var r;class l{}return(r=l).\u0275fac=function(n){return new(n||r)},r.\u0275mod=e.$C({type:r}),r.\u0275inj=e.G2t({imports:[E.iI.forChild(j),E.iI]}),l})(),O=(()=>{var r;class l{}return(r=l).\u0275fac=function(n){return new(n||r)},r.\u0275mod=e.$C({type:r}),r.\u0275inj=e.G2t({imports:[p.MD,u.YN,i.bv,R]}),l})()}}]);