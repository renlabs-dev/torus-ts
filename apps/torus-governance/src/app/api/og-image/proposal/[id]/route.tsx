import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { api } from "~/trpc/server";
import { env } from "~/env";
import { ProposalStatus } from "@torus-ts/api/types";
import { formatDate } from "@torus-ts/ui/utils/format-date";

// Define font files to be used
const interRegular = fetch(
  new URL('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap')
).then((res) => res.arrayBuffer());

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Valid proposal ID is required" }, { status: 400 });
    }

    // Fetch proposal data
    const [error, proposal] = await tryAsync(
      api.proposal.getProposalById({ id })
    );

    if (error !== undefined || !proposal) {
      console.error("Error fetching proposal data:", error);
      return generateDefaultOgImage("Proposal Not Found");
    }

    // Get status badge color
    const statusColor = getStatusColor(proposal.status);

    // Generate OG image with proposal data
    const fontData = await interRegular;
    
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            color: 'white',
            background: '#0f1729',
            width: '100%',
            height: '100%',
            padding: '50px 50px',
            textAlign: 'left',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative background element */}
          <div style={{ 
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 174, 239, 0.2) 0%, rgba(0, 174, 239, 0.05) 100%)',
            filter: 'blur(80px)',
            zIndex: '1',
          }} />
          
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', zIndex: '2' }}>
            <div style={{ 
              fontSize: '20px', 
              padding: '6px 14px',
              background: statusColor,
              borderRadius: '20px',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}>
              {proposal.status}
            </div>
            <h1 style={{ 
              fontSize: '60px', 
              margin: '0',
              maxWidth: '1000px',
              lineHeight: '1.2',
              fontWeight: 'bold',
            }}>
              {proposal.title ? (proposal.title.length > 60 ? `${proposal.title.substring(0, 60)}...` : proposal.title) : 'Proposal'}
            </h1>
          </div>
          
          {/* Description */}
          {proposal.summary ? (
            <p style={{ 
              fontSize: '28px', 
              margin: '10px 0', 
              maxWidth: '1000px', 
              opacity: 0.8,
              lineHeight: '1.4',
            }}>
              {proposal.summary.substring(0, 160)}
              {proposal.summary.length > 160 ? '...' : ''}
            </p>
          ) : null}
          
          {/* Footer info */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end',
            marginTop: 'auto',
            width: '100%',
            zIndex: '2',
          }}>
            {/* Left side - Date */}
            <div style={{ fontSize: '24px', opacity: '0.7' }}>
              Created: {formatDate(proposal.createdAt)}
            </div>
            
            {/* Right side - Torus DAO logo */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
            }}>
              <svg width="40" height="40" viewBox="0 0 200 200" fill="none">
                <path d="M100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20ZM100 40C133.137 40 160 66.8629 160 100C160 133.137 133.137 160 100 160C66.8629 160 40 133.137 40 100C40 66.8629 66.8629 40 100 40Z" fill="#00AEEF"/>
                <circle cx="100" cy="100" r="30" fill="#00AEEF"/>
              </svg>
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>Torus DAO</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
            weight: 400,
          },
        ],
      }
    );
  } catch (error: unknown) {
    console.error("Error generating OG image:", error);
    return NextResponse.json({ error: "Failed to generate OG image" }, { status: 500 });
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case ProposalStatus.Active:
      return 'rgba(34, 197, 94, 0.8)'; // green
    case ProposalStatus.Passed:
      return 'rgba(59, 130, 246, 0.8)'; // blue
    case ProposalStatus.Failed:
      return 'rgba(239, 68, 68, 0.8)'; // red
    case ProposalStatus.Executed:
      return 'rgba(139, 92, 246, 0.8)'; // purple
    case ProposalStatus.Expired:
      return 'rgba(156, 163, 175, 0.8)'; // gray
    default:
      return 'rgba(251, 191, 36, 0.8)'; // yellow
  }
}

async function generateDefaultOgImage(title: string) {
  const fontData = await interRegular;
  
  // Generate a simple default OG image
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          color: 'white',
          background: '#0f1729',
          width: '100%',
          height: '100%',
          padding: '50px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background element */}
        <div style={{ 
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 174, 239, 0.2) 0%, rgba(0, 174, 239, 0.05) 100%)',
          filter: 'blur(80px)',
          zIndex: '1',
        }} />
        
        <svg width="150" height="150" viewBox="0 0 200 200" fill="none" style={{ marginBottom: '30px', zIndex: '2' }}>
          <path d="M100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20ZM100 40C133.137 40 160 66.8629 160 100C160 133.137 133.137 160 100 160C66.8629 160 40 133.137 40 100C40 66.8629 66.8629 40 100 40Z" fill="#00AEEF"/>
          <circle cx="100" cy="100" r="30" fill="#00AEEF"/>
        </svg>
        <h1 style={{ fontSize: '60px', zIndex: '2', maxWidth: '900px' }}>
          {title && typeof title === 'string' && title.length > 30 ? `${title.substring(0, 30)}...` : title}
        </h1>
        <p style={{ fontSize: '30px', opacity: 0.8, zIndex: '2' }}>Torus DAO Governance</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}