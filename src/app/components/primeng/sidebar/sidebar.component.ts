import { Component, Input, signal } from '@angular/core';
import { SidebarModule } from 'primeng/sidebar';
import { CommonModule } from '@angular/common';
import { SidebarMenuItem } from '../../../app.interfaces';
import { AppService } from '../../../services/app.service';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { SvgComponent } from '../svg/svg.component';

@Component({
    selector: 'app-sidebar',
    imports: [SidebarModule, SidebarMenuComponent, SvgComponent, CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() menuItems: SidebarMenuItem[] = [];
  @Input() hideHeader: boolean = false;
  public activeMenuPath:SidebarMenuItem[] =[];
  public ArrowLeftIconPath: string = "assets/icons/Actions.arrowleft.flechaizquierda.svg";
  constructor(public appService: AppService) { }
  onMenuChange(newMenuPath: SidebarMenuItem[]) {
    this.activeMenuPath = [...newMenuPath];
  }

  onRestart(): void {
    this.activeMenuPath = [];
  }
  onMenuChangeExtended(newPath: SidebarMenuItem[], indexSubMenu: number | undefined ) {
    if(indexSubMenu !== undefined && indexSubMenu >= 0 ) {
      let newValues: SidebarMenuItem[] = [];
      if(indexSubMenu < this.activeMenuPath.length-1 && this.activeMenuPath[indexSubMenu].title !== newPath[0].title && newPath[0].items && newPath[0].items.length > 0) {
        newValues = [...this.activeMenuPath.slice(0,indexSubMenu+1),...newPath];
      }else if(newPath[0].items && newPath[0].items.length > 0){
        newValues = [...this.activeMenuPath.slice(0,this.activeMenuPath.length),...newPath]; 
      }else{

      }
      //Logger.info("NewValues for activeMenuPath", {newValues, activeMenuPath: this.activeMenuPath, indexSubMenu, newPath});
      if(newValues.length > 0) this.onMenuChange(newValues);
    }
  }
  getSidebarClass(): string{
    return `sidebar ${this.activeMenuPath.length>0? 'sidebar-extended' : ''} ${this.hideHeader? 'hideHeader' : ''}`;
  }
  onCloseSidebar(): void{
    this.onRestart();
    setTimeout(()=>this.appService.toggleSidebarMenu(),50);
  }
}
