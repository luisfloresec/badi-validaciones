import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentSection } from './document-section';

describe('DocumentSection', () => {
  let component: DocumentSection;
  let fixture: ComponentFixture<DocumentSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentSection],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
