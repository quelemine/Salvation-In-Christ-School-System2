import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui';

const LIBERIAN_COUNTIES = ['Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount', 'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland', 'Montserrado', 'Nimba', 'River Gee', 'River Cess', 'Sinoe'];
const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const QUALIFICATIONS = ['High School Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Teaching Certificate', 'Vocational Training'];

export default function BlankApplicationForm() {
  const [searchParams] = useSearchParams();
  const roleType = searchParams.get('type') || 'student';

  const isStudentRole = roleType === 'student';
  const isTeacherRole = roleType === 'teacher';

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          input, select, textarea { border: 1px solid black !important; background: white !important; }
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8 pb-4 border-b-2 border-black">
        <h1 className="text-2xl font-bold text-black mb-2">
          {isStudentRole ? 'STUDENT APPLICATION FORM' : 
           isTeacherRole ? 'TEACHER APPLICATION FORM' : 
           'ADMIN/STAFF APPLICATION FORM'}
        </h1>
        <p className="text-sm text-gray-600">Fill in all required fields marked with *</p>
      </div>

      {/* Personal Information */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-300 pb-2">PERSONAL INFORMATION</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-black mb-1">Full Name *</label>
            <input type="text" className="w-full px-3 py-2 border border-black" />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">Gender *</label>
            <select className="w-full px-3 py-2 border border-black">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">Date of Birth *</label>
            <input type="date" className="w-full px-3 py-2 border border-black" />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">Place of Birth</label>
            <input type="text" className="w-full px-3 py-2 border border-black" placeholder="City, Country" />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">Nationality</label>
            <input type="text" className="w-full px-3 py-2 border border-black" defaultValue="Liberia" />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">County *</label>
            <select className="w-full px-3 py-2 border border-black">
              <option value="">Select county</option>
              {LIBERIAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold text-black mb-1">Address</label>
            <input type="text" className="w-full px-3 py-2 border border-black" placeholder="Residential address" />
          </div>
        </div>
      </div>

      {/* Role-specific Information */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-300 pb-2">
          {isStudentRole ? 'STUDENT INFORMATION' : 'STAFF INFORMATION'}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {isStudentRole ? (
            <>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Previous School</label>
                <input type="text" className="w-full px-3 py-2 border border-black" placeholder="Name of previous school" />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Grade Applying For *</label>
                <select className="w-full px-3 py-2 border border-black">
                  <option value="">Select grade</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Father's Name *</label>
                <input type="text" className="w-full px-3 py-2 border border-black" placeholder="Father's full name" />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Father's Contact *</label>
                <input type="text" className="w-full px-3 py-2 border border-black" placeholder="+231..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Mother's Name</label>
                <input type="text" className="w-full px-3 py-2 border border-black" placeholder="Mother's full name" />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Mother's Contact</label>
                <input type="text" className="w-full px-3 py-2 border border-black" placeholder="+231..." />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Email *</label>
                <input type="email" className="w-full px-3 py-2 border border-black" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Phone *</label>
                <input type="text" className="w-full px-3 py-2 border border-black" placeholder="+231..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Qualification *</label>
                <select className="w-full px-3 py-2 border border-black">
                  <option value="">Select qualification</option>
                  {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">Hire Date *</label>
                <input type="date" className="w-full px-3 py-2 border border-black" />
              </div>
              {isTeacherRole && (
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-black mb-1">Subject Specialization</label>
                  <input type="text" className="w-full px-3 py-2 border border-black" placeholder="e.g., Mathematics, Science" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-300 pb-2">EMERGENCY CONTACT</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-black mb-1">Emergency Contact Name *</label>
            <input type="text" className="w-full px-3 py-2 border border-black" placeholder="Emergency contact person" />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1">Emergency Contact Phone *</label>
            <input type="text" className="w-full px-3 py-2 border border-black" placeholder="+231..." />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-300 pb-2">ADDITIONAL INFORMATION</h2>
        <div className="space-y-4">
          {isStudentRole && (
            <div>
              <label className="block text-sm font-bold text-black mb-1">Sports Interest</label>
              <input type="text" className="w-full px-3 py-2 border border-black" placeholder="Sports activities interested in" />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-black mb-1">Additional Notes</label>
            <textarea className="w-full px-3 py-2 border border-black" rows={3} placeholder="Any additional information" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 border-black">
        <p className="text-sm text-gray-600 text-center">
          Please review all information before submitting. Ensure all required fields marked with * are completed.
        </p>
      </div>

      {/* Print button (hidden in print) */}
      <div className="mt-6 text-center no-print">
        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
          🖨️ Print Form
        </Button>
        <Button onClick={() => window.close()} variant="secondary" className="ml-2">
          Close
        </Button>
      </div>
    </div>
  );
}
