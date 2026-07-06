import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuilderPreviewStepComponent } from './builder-preview-step.component';

describe('BuilderPreviewStepComponent', () => {
  let fixture: ComponentFixture<BuilderPreviewStepComponent>;
  let component: BuilderPreviewStepComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderPreviewStepComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BuilderPreviewStepComponent);
    component = fixture.componentInstance;
    component.fields = [
      {
        label: 'Desk Location',
        fieldType: 'TEXTBOX',
        required: true,
        displayOrder: 1
      }
    ];
    component.generatedJson = '{"facilityName":"Desk Booking"}';
    fixture.detectChanges();
  });

  it('renders field summary and json text', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Desk Location');
    expect(text).toContain('TEXTBOX');
    expect(text).toContain('Desk Booking');
  });
});
