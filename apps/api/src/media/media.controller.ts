import {
  Controller,
  Post,
  Body,
  Param,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Auth, AdminAuth, CurrentUser } from '../common/decorators';
import { CloudinaryService } from './cloudinary.service';
import { MuxService } from './mux.service';
import {
  UploadSignRequestDto,
  UploadSignResponseDto,
  VideoUploadRequestDto,
  VideoUploadResponseDto,
  PlaybackTokenResponseDto,
  uploadSignRequestSchema,
  videoUploadRequestSchema,
} from '@sofe/shared';
import { ZodValidationPipe } from '../common/pipes';
import {
  Lesson,
  LessonDocument,
  Enrollment,
  EnrollmentDocument,
  UserDocument,
} from '../database/schemas';

@Controller()
export class MediaController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly muxService: MuxService,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  /**
   * Generates a signed direct-upload signature for Cloudinary.
   */
  @Post('uploads/sign')
  @Auth()
  signUpload(@Body(new ZodValidationPipe(uploadSignRequestSchema)) body: UploadSignRequestDto): {
    data: UploadSignResponseDto;
  } {
    const signed = this.cloudinaryService.signUpload(body.purpose);
    return { data: signed };
  }

  /**
   * Admin endpoint to create a Mux direct video upload URL.
   */
  @Post('admin/media/video-upload')
  @AdminAuth('course:write')
  async createVideoUpload(
    @Body(new ZodValidationPipe(videoUploadRequestSchema)) body: VideoUploadRequestDto,
  ): Promise<{ data: VideoUploadResponseDto }> {
    const upload = await this.muxService.createDirectUploadUrl(body.corsOrigin, body.passthrough);
    return { data: upload };
  }

  /**
   * Generates a signed Mux playback token for an authorized lesson.
   * Access is granted if the lesson is a free preview OR if the learner has an active enrollment.
   */
  @Post('lessons/:id/playback-token')
  @Auth()
  async getLessonPlaybackToken(
    @Param('id') lessonId: string,
    @CurrentUser() user: UserDocument,
  ): Promise<{ data: PlaybackTokenResponseDto }> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Invalid lesson ID',
      });
    }

    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson does not exist',
      });
    }

    const playbackId = lesson.video?.mux?.playbackId;
    if (!playbackId) {
      throw new BadRequestException({
        code: 'LESSON_NO_VIDEO',
        message: 'This lesson does not contain a ready video asset',
      });
    }

    // Access check: allow free preview without enrollment
    if (!lesson.isFreePreview) {
      const activeEnrollment = await this.enrollmentModel.findOne({
        userId: user._id,
        courseId: lesson.courseId,
        status: 'active',
      });

      if (!activeEnrollment) {
        throw new ForbiddenException({
          code: 'ENROLLMENT_REQUIRED',
          message: 'Active course enrollment is required to stream this lesson',
        });
      }
    }

    const token = this.muxService.generatePlaybackToken(playbackId);
    return {
      data: {
        token,
        playbackId,
      },
    };
  }
}
