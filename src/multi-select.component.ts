import {AfterViewInit, Component, forwardRef, Input, Renderer} from "@angular/core";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Subject} from "rxjs/Subject";
import {API} from "../../shared/lib/api/api";
import {ShowOrHideMaskService} from "../../shared/services/app-service/show-or-hide-mask.service";
@Component({
    selector: 'multi-select',
    templateUrl: 'multi-select.component.html',
    styleUrls: ['multi-select.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MultiSelectCmp),
            multi: true
        }
    ]
})
export class MultiSelectCmp implements ControlValueAccessor, AfterViewInit{
    @Input() inputWidth = 200;
    @Input() endpoint = 'bmsUserManageController.findSecondBusinessList'; // 可使用其他接口查询数据
    _value = [];
    bodyClickListener: any;
    panelVisible = false; // 是否显示面板，true为显示
    searchResult = []; // 输入关键字后得到的搜索结果
    typeFlow = new Subject<any>();
    constructor(
        public renderer: Renderer,
        public api: API,
        public mask: ShowOrHideMaskService
    ){
        this.typeFlow
            .debounceTime(250)
            .subscribe(key => {
                if(key){
                   this.getData(key);
                }
            })
    }
    onChange = (val: any[]) => {};
    onTouched = () => {};

    ngAfterViewInit(){
        this.bodyClickListener = this.renderer.listenGlobal('body', 'click', () => { this.hidePanel() });
    }

    get value(): any[]{
        return this._value;
    }

    set value(val: any[]){
        if(val !== this._value){
            this._value = val;
            this.onChange(val);
        }
    }

    writeValue(val: any): void {
        if(val !== this.value){
            this.value = val;
        }
    }

    registerOnChange(fn: (val: any[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    showPanel(){
        this.panelVisible = true;
    }

    hidePanel(){
        this.panelVisible = false;
    }

    /**
     * 容器点击事件
     * @param e
     */
    onInputClick(e){
        e.stopPropagation();
        this.onTouched();
        if(!this.panelVisible){
            this.showPanel();
        }
    }

    /**
     * 面板点击事件
     * @param e
     */
    onPanelClick(e){
        e.stopPropagation();
    }

    /**
     * 搜索结果点击事件
     * @param item
     */
    onItemClick(item){
        let index = this._value.indexOf(item);
        if(index < 0){
            this._value.push(item);
            this.value = _.cloneDeep(this._value);
        }else{
            this._value.splice(index,1);
            this.value = _.cloneDeep(this._value);
        }
        this.writeValue(this.value);
    }

    /**
     * 删除一项
     * @param e
     * @param i
     */
    deleteItem(e, i){
        e.stopPropagation();
        this._value.splice(i,1);
        this.value = _.cloneDeep(this._value);
        this.writeValue(this.value);
    }

    /**
     * 全选
     */
    selectAll(){
        let unSelect;
        unSelect = this.searchResult.filter(item => {
            return this._value.indexOf(item) < 0;
        });
        this.value = this._value.concat(unSelect);
        this.writeValue(this.value);
        this.hidePanel();
    }

    /**
     * 遍历性能优化
     * @param index
     * @returns {any}
     */
    trackByIndex(index){
        return index;
    }

    getData(keyword){
        this.api.call(this.endpoint,
            {
                "first": 0,
                "rows": 99
            },
            {
                "name": keyword
            })
            .ok(res => {
                if(res && res.result){
                    this.searchResult = res.result;
                }
            })
            .fail(err => {
                this.mask.info('error',err.error || '发生错误，搜索失败！');
            })
    }
}
