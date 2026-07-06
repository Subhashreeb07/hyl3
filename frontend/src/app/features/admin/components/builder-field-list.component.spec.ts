import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuilderFieldListComponent } from './builder-field-list.component';
import { FacilityField } from '../../../core/models/specification.models';

describe('BuilderFieldListComponent', () => {
  let fixture: ComponentFixture<BuilderFieldListComponent>;
  let component: BuilderFieldListComponent;

  const fields: FacilityField[] = [
    {
      fieldId: 1,
      label: 'Meal Type',
      fieldType: 'DROPDOWN',
      required: true,
      displayOrder: 1,
      options: ['Veg', 'Non-Veg']
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderFieldListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BuilderFieldListComponent);
    component = fixture.componentInstance;
    component.fields = fields;
    fixture.detectChanges();
  });

  it('renders provided fields', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Meal Type');
    expect(text).toContain('DROPDOWN');
  });

  it('emits add action', () => {
    spyOn(component.add, 'emit');
    const addButton = fixture.nativeElement.querySelector('.satori-primary') as HTMLButtonElement;
    addButton.click();
    expect(component.add.emit).toHaveBeenCalled();
  });
});
