import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1777345644816 implements MigrationInterface {
  name = 'Initial1777345644816';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "youtube_id" character varying(20) NOT NULL, "title" character varying(500) NOT NULL, "description" text DEFAULT '', "thumbnail_url" character varying(500), "duration" character varying(20), "view_count" integer NOT NULL DEFAULT '0', "upvote_count" integer NOT NULL DEFAULT '0', "downvote_count" integer NOT NULL DEFAULT '0', "shared_by_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4c86c0cf95aff16e9fb8220f6b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_10db4256c96824e89c22fff501" ON "videos" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32ec610616dbadc79a7005d625" ON "videos" ("youtube_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(30) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."votes_type_enum" AS ENUM('up', 'down')`,
    );
    await queryRunner.query(
      `CREATE TABLE "votes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."votes_type_enum" NOT NULL, "user_id" uuid NOT NULL, "video_id" uuid NOT NULL, CONSTRAINT "UQ_5bf47966afd499661abeb9dd31a" UNIQUE ("user_id", "video_id"), CONSTRAINT "PK_f3d9fd4a0af865152c3f59db8ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_321b38e119d4716a0e4533334c" ON "votes" ("video_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27be2cab62274f6876ad6a3164" ON "votes" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD CONSTRAINT "FK_a12e40aeaee7a6208362ba58136" FOREIGN KEY ("shared_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "votes" ADD CONSTRAINT "FK_27be2cab62274f6876ad6a31641" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "votes" ADD CONSTRAINT "FK_321b38e119d4716a0e4533334c2" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "votes" DROP CONSTRAINT "FK_321b38e119d4716a0e4533334c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "votes" DROP CONSTRAINT "FK_27be2cab62274f6876ad6a31641"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP CONSTRAINT "FK_a12e40aeaee7a6208362ba58136"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_27be2cab62274f6876ad6a3164"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_321b38e119d4716a0e4533334c"`,
    );
    await queryRunner.query(`DROP TABLE "votes"`);
    await queryRunner.query(`DROP TYPE "public"."votes_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32ec610616dbadc79a7005d625"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_10db4256c96824e89c22fff501"`,
    );
    await queryRunner.query(`DROP TABLE "videos"`);
  }
}
