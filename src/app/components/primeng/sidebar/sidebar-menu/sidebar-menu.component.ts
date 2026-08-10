import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../../../services/app.service';
import { SidebarMenuItem } from '../../../../app.interfaces';
import { SvgComponent } from '../../svg/svg.component';
import { MessageService } from 'primeng/api';

type IndexSubMenu = number | undefined;
type OnMenuChangeExtended = (newMenuPath: SidebarMenuItem[],indexSubMenu: number)=>void;
type OnMenuChange = (newMenuPath: SidebarMenuItem[])=>void;

@Component({
    selector: 'app-sidebar-menu',
    imports: [CommonModule, SvgComponent],
    templateUrl: './sidebar-menu.component.html',
    styleUrl: './sidebar-menu.component.scss'
})
export class SidebarMenuComponent {
  @Input() menuItems: SidebarMenuItem[] | undefined = [];
  @Input() indexSubMenu: IndexSubMenu = undefined;
  @Input() activeMenuPath: SidebarMenuItem[] = [];
  @Input() onMenuChange: OnMenuChange | undefined = undefined;
  @Input() onMenuChangeExtended: OnMenuChangeExtended | undefined = undefined;
  public ArrowRightIconPath: string = "assets/icons/Actions.arrowright.flechaderecha.svg";
  constructor(
    public appService: AppService,
    private messageService: MessageService
  ){ }
  public getIconClass(icon:string|undefined) {
    return `pi pi-${icon} sidebarIcon`;
  }
  private isSelected(item: SidebarMenuItem, items: SidebarMenuItem[] = this.activeMenuPath): boolean {
    for (let element of items) {
      if (element.title === item.title) {
        return true;
      }
  
      if (element.items && element.items.length > 0) {
        if (this.isSelected(item, element.items)) {
          return true;
        }
      }
    }
  
    return false;
  }
  public getItemClass(item: SidebarMenuItem): string {
    return `menuItem ${this.indexSubMenu !== undefined ? 'submenuList' : ''} ${ this.isSelected(item) ? ' selected-title':''}`; 
  } 
  handleClickItem(item: SidebarMenuItem): void {
    if( (this.indexSubMenu) && this.onMenuChange && item.items && item.items.length>0 ) {
      this.onMenuChange([...this.activeMenuPath,item]);
    }else if( !this.indexSubMenu && this.onMenuChange ) {
      this.onMenuChange([item])
    }else if((this.indexSubMenu !== undefined && this.indexSubMenu >= 0 && item.items && item.items.length > 0) && !this.isSelected(item) && this.onMenuChangeExtended) {
      this.onMenuChangeExtended([item],this.indexSubMenu);
    }else{
      this.messageService.add({ 
        severity: "info", 
        summary: "Clicked", 
        detail: `Fake redirect to: '${item.to}'`, 
        icon: item.icon 
      });
    }
  }
}
