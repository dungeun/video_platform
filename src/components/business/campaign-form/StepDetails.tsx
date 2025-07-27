import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon } from 'lucide-react'

interface StepDetailsProps {
  formData: {
    budget: string
    targetFollowers: string
    startDate: string
    endDate: string
    announcementDate: string
    requirements: string
    hashtags: string
  }
  setFormData: (data: any) => void
}

export default function StepDetails({ formData, setFormData }: StepDetailsProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">캠페인 상세 정보</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">예산 (원)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              placeholder="1000000"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="targetFollowers">최소 팔로워 수</Label>
            <Input
              id="targetFollowers"
              type="number"
              value={formData.targetFollowers}
              onChange={(e) => setFormData({...formData, targetFollowers: e.target.value})}
              placeholder="10000"
              className="mt-1"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">캠페인 시작일</Label>
              <div className="relative mt-1">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="endDate">캠페인 종료일</Label>
              <div className="relative mt-1">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="announcementDate">지원자 발표일</Label>
            <div className="relative mt-1">
              <Input
                id="announcementDate"
                type="date"
                value={formData.announcementDate}
                onChange={(e) => setFormData({...formData, announcementDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                max={formData.startDate || undefined}
                required
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-sm text-gray-500 mt-1">선정된 인플루언서를 발표할 날짜입니다. 캠페인 시작일 이전이어야 합니다.</p>
          </div>
        </div>

        <div>
          <Label htmlFor="requirements">참여 조건 및 요구사항</Label>
          <Textarea
            id="requirements"
            value={formData.requirements}
            onChange={(e) => setFormData({...formData, requirements: e.target.value})}
            placeholder="인플루언서가 충족해야 할 조건이나 콘텐츠 제작 가이드라인을 작성해주세요."
            className="mt-1 h-32"
          />
        </div>

        <div>
          <Label htmlFor="hashtags">해시태그 (공백으로 구분)</Label>
          <Input
            id="hashtags"
            value={formData.hashtags}
            onChange={(e) => setFormData({...formData, hashtags: e.target.value})}
            placeholder="#뷰티 #스킨케어 #신제품"
            className="mt-1"
          />
        </div>
      </div>
    </>
  )
}