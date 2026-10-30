export interface RegisterStudentCommand {
  studentEmailAddress: string;
  plainTextPassword: string;
  studentFullName: string;
  universityId: string;
}
