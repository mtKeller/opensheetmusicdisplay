import {Fraction} from "../../Common/DataObjects/fraction";
import {Voice} from "./Voice";
import {SourceStaffEntry} from "./SourceStaffEntry";
import {Note} from "./Note";
import {Pitch} from "../../Common/DataObjects/pitch";
import {LyricsEntry} from "./Lyrics/LyricsEntry";
import {TechnicalInstruction} from "./Instructions/TechnicalInstruction";
import {OrnamentContainer} from "./OrnamentContainer";
import {KeyInstruction} from "./Instructions/KeyInstruction";
import {OrnamentEnum} from "./OrnamentContainer";
import {AccidentalEnum} from "../../Common/DataObjects/pitch";


export class VoiceEntry {
  constructor(timestamp: Fraction, parentVoice: Voice, parentSourceStaffEntry: SourceStaffEntry) {
    this.timestamp = timestamp;
    this.parentVoice = parentVoice;
    this.parentSourceStaffEntry = parentSourceStaffEntry;
  }
  public GraceVoiceEntriesBefore: VoiceEntry[];
  public GraceVoiceEntriesAfter: VoiceEntry[];
  private parentVoice: Voice;
  private parentSourceStaffEntry: SourceStaffEntry;
  private timestamp: Fraction;
  private notes: Note[] = new Array();
  private articulations: ArticulationEnum[] = new Array();
  private technicalInstructions: TechnicalInstruction[] = new Array();
  private lyricsEntries: { [n: number]: LyricsEntry; } = {};
  private arpeggiosNotesIndices: number[] = new Array();
  private ornamentContainer: OrnamentContainer;
  public get ParentSourceStaffEntry(): SourceStaffEntry {
    return this.parentSourceStaffEntry;
  }
  public get ParentVoice(): Voice {
    return this.parentVoice;
  }
  public get Timestamp(): Fraction {
    return this.timestamp;
  }
  public set Timestamp(value: Fraction) {
    this.timestamp = value;
  }
  public get Notes(): Note[] {
    return this.notes;
  }
  public get Articulations(): ArticulationEnum[] {
    return this.articulations;
  }
  public get TechnicalInstructions(): TechnicalInstruction[] {
    return this.technicalInstructions;
  }
  public get LyricsEntries(): { [n: number]: LyricsEntry; } {
    return this.lyricsEntries;
  }
  public set LyricsEntries(value: { [n: number]: LyricsEntry; }) {
    this.lyricsEntries = value;
  }
  public get ArpeggiosNotesIndices(): number[] {
    return this.arpeggiosNotesIndices;
  }
  public set ArpeggiosNotesIndices(value: number[]) {
    this.arpeggiosNotesIndices = value;
  }
  public get OrnamentContainer(): OrnamentContainer {
    return this.ornamentContainer;
  }
  public set OrnamentContainer(value: OrnamentContainer) {
    this.ornamentContainer = value;
  }
  public static isSupportedArticulation(articulation: ArticulationEnum): boolean {
    switch (articulation) {
      case ArticulationEnum.accent:
      case ArticulationEnum.strongaccent:
      case ArticulationEnum.invertedstrongaccent:
      case ArticulationEnum.staccato:
      case ArticulationEnum.staccatissimo:
      case ArticulationEnum.spiccato:
      case ArticulationEnum.tenuto:
      case ArticulationEnum.fermata:
      case ArticulationEnum.invertedfermata:
      case ArticulationEnum.breathmark:
      case ArticulationEnum.caesura:
      case ArticulationEnum.lefthandpizzicato:
      case ArticulationEnum.naturalharmonic:
      case ArticulationEnum.snappizzicato:
      case ArticulationEnum.upbow:
      case ArticulationEnum.downbow:
        return true;
      default:
        return false;
    }
  }
  public hasTie(): boolean {
    for (let idx: number = 0, len: number = this.Notes.length; idx < len; ++idx) {
      let note: Note = this.Notes[idx];
      if (note.NoteTie !== undefined) { return true; }
    }
    return false;
  }
  public hasSlur(): boolean {
    for (let idx: number = 0, len: number = this.Notes.length; idx < len; ++idx) {
      let note: Note = this.Notes[idx];
      if (note.NoteSlurs.length > 0) { return true; }
    }
    return false;
  }
  public isStaccato(): boolean {
    for (let idx: number = 0, len: number = this.Articulations.length; idx < len; ++idx) {
      let articulation: ArticulationEnum = this.Articulations[idx];
      if (articulation === ArticulationEnum.staccato) { return true; }
    }
    return false;
  }
  public isAccent(): boolean {
    for (let idx: number = 0, len: number = this.Articulations.length; idx < len; ++idx) {
      let articulation: ArticulationEnum = this.Articulations[idx];
      if (articulation === ArticulationEnum.accent || articulation === ArticulationEnum.strongaccent) {
        return true;
      }
    }
    return false;
  }
  public getVerseNumberForLyricEntry(lyricsEntry: LyricsEntry): number {
    for (let key in this.lyricsEntries) {
      if (lyricsEntry === this.lyricsEntries[key]) {
        return key;
      } // FIXME
    }
    return 1;
  }
  public createVoiceEntriesForOrnament(activeKey: KeyInstruction): VoiceEntry[] {
    return this.createVoiceEntriesForOrnament(this, activeKey);
  }
  public createVoiceEntriesForOrnament(voiceEntryWithOrnament: VoiceEntry, activeKey: KeyInstruction): VoiceEntry[] {
    let voiceEntries: VoiceEntry[] = new Array();
    if (voiceEntryWithOrnament.ornamentContainer === undefined) {
      return;
    }
    let baseNote: Note = this.notes[0];
    let baselength: Fraction = baseNote.calculateNoteLengthWithoutTie();
    let baseVoice: Voice = voiceEntryWithOrnament.ParentVoice;
    let baseTimestamp: Fraction = voiceEntryWithOrnament.Timestamp;
    let currentTimestamp: Fraction = Fraction.CreateFractionFromFraction(baseTimestamp);
    //let length: Fraction;
    switch (voiceEntryWithOrnament.ornamentContainer.GetOrnament) {
      case OrnamentEnum.Trill: {
          let length = new Fraction(baselength.Numerator, baselength.Denominator * 8);
          let higherPitch: Pitch = baseNote.Pitch.getTransposedPitch(1);
          let alteration: AccidentalEnum = activeKey.getAlterationForPitch(higherPitch);
          if (voiceEntryWithOrnament.OrnamentContainer.AccidentalAbove !== AccidentalEnum.NONE) {
            alteration = <AccidentalEnum><number>voiceEntryWithOrnament.ornamentContainer.AccidentalAbove;
          }
          for (let i: number = 0; i < 8; i++) {
            if ((i % 2) === 0) {
              currentTimestamp = Fraction.plus(baseTimestamp, new Fraction(i * length.Numerator, length.Denominator));
              this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
            } else {
              currentTimestamp = Fraction.plus(baseTimestamp, new Fraction(i * length.Numerator, length.Denominator));
              this.createAlteratedVoiceEntry(
                currentTimestamp, length, baseVoice, higherPitch, alteration, voiceEntries
              );
            }
          }
        }
        break;
      case OrnamentEnum.Turn: {
          let length = new Fraction(baselength.Numerator, baselength.Denominator * 4);
          let lowerPitch: Pitch = baseNote.Pitch.getTransposedPitch(-1);
          let lowerAlteration: AccidentalEnum = activeKey.getAlterationForPitch(lowerPitch);
          let higherPitch: Pitch = baseNote.Pitch.getTransposedPitch(1);
          let higherAlteration: AccidentalEnum = activeKey.getAlterationForPitch(higherPitch);
          this.createAlteratedVoiceEntry(
            currentTimestamp, length, baseVoice, higherPitch, higherAlteration, voiceEntries
          );
          currentTimestamp += length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
          currentTimestamp += length;
          this.createAlteratedVoiceEntry(
            currentTimestamp, length, baseVoice, lowerPitch, lowerAlteration, voiceEntries
          );
          currentTimestamp += length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
        }
        break;
      case OrnamentEnum.InvertedTurn: {
          let length = new Fraction(baselength.Numerator, baselength.Denominator * 4);
          let lowerPitch: Pitch = baseNote.Pitch.getTransposedPitch(-1);
          let lowerAlteration: AccidentalEnum = activeKey.getAlterationForPitch(lowerPitch);
          let higherPitch: Pitch = baseNote.Pitch.getTransposedPitch(1);
          let higherAlteration: AccidentalEnum = activeKey.getAlterationForPitch(higherPitch);
          this.createAlteratedVoiceEntry(
            currentTimestamp, length, baseVoice, lowerPitch, lowerAlteration, voiceEntries
          );
          currentTimestamp += length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
          currentTimestamp += length;
          this.createAlteratedVoiceEntry(
            currentTimestamp, length, baseVoice, higherPitch, higherAlteration, voiceEntries
          );
          currentTimestamp += length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
        }
        break;
      case OrnamentEnum.DelayedTurn: {
          let length = new Fraction(baselength.Numerator, baselength.Denominator * 2);
          let lowerPitch: Pitch = baseNote.Pitch.getTransposedPitch(-1);
          let lowerAlteration: AccidentalEnum = activeKey.getAlterationForPitch(lowerPitch);
          let higherPitch: Pitch = baseNote.Pitch.getTransposedPitch(1);
          let higherAlteration: AccidentalEnum = activeKey.getAlterationForPitch(higherPitch);
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
          currentTimestamp = Fraction.plus(baseTimestamp, length);
          length.Denominator = baselength.Denominator * 8;
          this.createAlteratedVoiceEntry(currentTimestamp, length, baseVoice, higherPitch, higherAlteration, voiceEntries);
          currentTimestamp += length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
          currentTimestamp += length;
          this.createAlteratedVoiceEntry(currentTimestamp, length, baseVoice, lowerPitch, lowerAlteration, voiceEntries);
          currentTimestamp += length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
        }
        break;
      case OrnamentEnum.DelayedInvertedTurn: {
          let length = new Fraction(baselength.Numerator, baselength.Denominator * 2);
          let lowerPitch: Pitch = baseNote.Pitch.getTransposedPitch(-1);
          let lowerAlteration: AccidentalEnum = activeKey.getAlterationForPitch(lowerPitch);
          let higherPitch: Pitch = baseNote.Pitch.getTransposedPitch(1);
          let higherAlteration: AccidentalEnum = activeKey.getAlterationForPitch(higherPitch);
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
          currentTimestamp = Fraction.plus(baseTimestamp, length);
          length.Denominator = baselength.Denominator * 8;
          this.createAlteratedVoiceEntry(currentTimestamp, length, baseVoice, lowerPitch, lowerAlteration, voiceEntries);
          currentTimestamp += length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
          currentTimestamp += length;
          this.createAlteratedVoiceEntry(currentTimestamp, length, baseVoice, higherPitch, higherAlteration, voiceEntries);
          currentTimestamp += length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
        }
        break;
      case OrnamentEnum.Mordent: {
          let length = new Fraction(baselength.Numerator, baselength.Denominator * 4);
          let higherPitch: Pitch = baseNote.Pitch.getTransposedPitch(1);
          let alteration: AccidentalEnum = activeKey.getAlterationForPitch(higherPitch);
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
          currentTimestamp += length;
          this.createAlteratedVoiceEntry(currentTimestamp, length, baseVoice, higherPitch, alteration, voiceEntries);
          length.Denominator = baselength.Denominator * 2;
          currentTimestamp = baseTimestamp + length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
        }
        break;
      case OrnamentEnum.InvertedMordent: {
          let length = new Fraction(baselength.Numerator, baselength.Denominator * 4);
          let lowerPitch: Pitch = baseNote.Pitch.getTransposedPitch(-1);
          let alteration: AccidentalEnum = activeKey.getAlterationForPitch(lowerPitch);
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
          currentTimestamp += length;
          this.createAlteratedVoiceEntry(currentTimestamp, length, baseVoice, lowerPitch, alteration, voiceEntries);
          length.Denominator = baselength.Denominator * 2;
          currentTimestamp = baseTimestamp + length;
          this.createBaseVoiceEntry(currentTimestamp, length, baseVoice, baseNote, voiceEntries);
        }
        break;
      default:
        throw new RangeError();
    }
    return voiceEntries;
  }
  private createBaseVoiceEntry(
    currentTimestamp: Fraction, length: Fraction, baseVoice: Voice, baseNote: Note, voiceEntries: VoiceEntry[]
  ): void {
    let voiceEntry: VoiceEntry = new VoiceEntry(currentTimestamp, baseVoice, baseNote.ParentStaffEntry);
    let pitch: Pitch = new Pitch(baseNote.Pitch.FundamentalNote, baseNote.Pitch.Octave, baseNote.Pitch.Accidental);
    let note: Note = new Note(voiceEntry, undefined, length, pitch);
    voiceEntry.Notes.push(note);
    voiceEntries.push(voiceEntry);
  }
  private createAlteratedVoiceEntry(
    currentTimestamp: Fraction, length: Fraction, baseVoice: Voice, higherPitch: Pitch, alteration: AccidentalEnum, voiceEntries: VoiceEntry[]
  ): void {
    let voiceEntry: VoiceEntry = new VoiceEntry(currentTimestamp, baseVoice, undefined);
    let pitch: Pitch = new Pitch(higherPitch.FundamentalNote, higherPitch.Octave, alteration);
    let note: Note = new Note(voiceEntry, undefined, length, pitch);
    voiceEntry.Notes.push(note);
    voiceEntries.push(voiceEntry);
  }
}

export enum ArticulationEnum {
  accent,
  strongaccent,
  invertedstrongaccent,
  staccato,
  staccatissimo,
  spiccato,
  tenuto,
  fermata,
  invertedfermata,
  breathmark,
  caesura,
  lefthandpizzicato,
  naturalharmonic,
  snappizzicato,
  upbow,
  downbow,
  scoop,
  plop,
  doit,
  falloff,
  stress,
  unstress,
  detachedlegato,
  otherarticulation
}
