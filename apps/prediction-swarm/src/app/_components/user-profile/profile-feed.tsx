import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Badge } from "@torus-ts/ui/components/badge";
import { FileText, MessageSquare, Tag, User } from "lucide-react";

const activityData = [
  {
    id: "1",
    type: "status_change",
    user: { name: "Angelina Gotelli", initials: "AG" },
    action: "has change",
    target: "PD-979",
    status: { text: "Completed", color: "green" },
    timestamp: "06:20 PM",
    date: "SUNDAY, 06 MARCH",
  },
  {
    id: "2",
    type: "comment",
    user: {
      name: "Max Alexander",
      initials: "MA",
      avatar: "/thoughtful-man.png",
    },
    action: "comment on your",
    target: "Post",
    comment:
      "Fine, Java MIGHT be a good example of what a programming language should be like. But Java applications are good examples of what applications SHOULDN'T be like.",
    timestamp: "05:53 PM",
    date: "SUNDAY, 06 MARCH",
  },
  {
    id: "3",
    type: "tag_added",
    user: { name: "Eugene Stewart", initials: "ES" },
    action: "added tags",
    tags: [
      { text: "Live Issue", color: "red" },
      { text: "Backend", color: "blue" },
    ],
    timestamp: "04:40 PM",
    date: "SUNDAY, 06 MARCH",
  },
  {
    id: "4",
    type: "file_added",
    user: { name: "Shannon Baker", initials: "SB" },
    action: "added",
    target: "document.csv",
    timestamp: "03:18 PM",
    date: "SUNDAY, 06 MARCH",
  },
  {
    id: "5",
    type: "mention",
    user: {
      name: "Roberta Horton",
      initials: "RH",
      avatar: "/diverse-woman-portrait.png",
    },
    action: "mentioned you in a comment",
    target: "Post",
    comment:
      "@Carolyn One of the main causes of the fall of the Roman Empire was that-lacking zero-they had no way to indicate successful termination of their C programs.",
    timestamp: "02:17 PM",
    date: "SUNDAY, 06 MARCH",
  },
  {
    id: "6",
    type: "assignment",
    user: { name: "Lee Wheeler", initials: "LW" },
    action: "assigned ticket",
    target: "PD-1092",
    assignee: "Alvin Moreno",
    timestamp: "11:13 AM",
    date: "SUNDAY, 06 MARCH",
  },
  {
    id: "7",
    type: "comment",
    user: {
      name: "Jessica Wells",
      initials: "JW",
      avatar: "/woman-flowers.jpg",
    },
    action: "comment on your",
    target: "Post",
    comment:
      "The trouble with programmers is that you can never tell what a programmer is doing until it's too late.",
    timestamp: "08:49 AM",
    date: "SATURDAY, 05 MARCH",
  },
  {
    id: "8",
    type: "status_change",
    user: { name: "Earl Miles", initials: "EM", avatar: "/man-beard.jpg" },
    action: "has change",
    target: "PD-977",
    status: { text: "In progress", color: "blue" },
    timestamp: "08:30 AM",
    date: "SATURDAY, 05 MARCH",
  },
];

const getStatusColor = (color: string) => {
  switch (color) {
    case "green":
      return "bg-green-100 text-green-800";
    case "blue":
      return "bg-blue-100 text-blue-800";
    case "red":
      return "bg-red-100 text-red-800";
    case "orange":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTagColor = (color: string) => {
  switch (color) {
    case "red":
      return "bg-red-500";
    case "blue":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "tag_added":
      return <Tag className="text-muted-foreground h-4 w-4" />;
    case "file_added":
      return <FileText className="text-muted-foreground h-4 w-4" />;
    case "comment":
    case "mention":
      return <MessageSquare className="text-muted-foreground h-4 w-4" />;
    case "assignment":
      return <User className="text-muted-foreground h-4 w-4" />;
    default:
      return null;
  }
};

export function ProfileFeed() {
  let currentDate = "";

  return (
    <div className="mx-auto p-4 md:p-4">
      {/* Activity Timeline */}
      <div className="space-y-4 md:space-y-6">
        {activityData.map((item) => {
          const showDate = currentDate !== item.date;
          if (showDate) {
            // eslint-disable-next-line react-hooks/immutability
            currentDate = item.date;
          }

          return (
            <div key={item.id}>
              {/* Date Header */}
              {showDate && (
                <div className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide md:mb-4 md:text-sm">
                  {item.date}
                </div>
              )}

              {/* Activity Item */}
              <div className="relative flex gap-2 md:gap-3">
                {/* Timeline Line */}
                <div className="bg-border absolute bottom-0 left-3 top-10 w-px md:left-4 md:top-12" />

                {/* Avatar or Icon */}
                <div className="relative z-10">
                  {item.type === "tag_added" || item.type === "file_added" ? (
                    <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full md:h-8 md:w-8">
                      {getActivityIcon(item.type)}
                    </div>
                  ) : (
                    <Avatar className="h-6 w-6 md:h-8 md:w-8">
                      <AvatarImage
                        src={item.user.avatar || "/placeholder.svg"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {item.user.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:gap-2 md:text-sm">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="text-foreground font-medium">
                        {item.user.name}
                      </span>
                      <span className="text-muted-foreground">
                        {item.action}
                      </span>
                      {item.target && (
                        <span className="text-foreground font-medium">
                          {item.target}
                        </span>
                      )}
                      {item.status && (
                        <>
                          <span className="text-muted-foreground">
                            status to
                          </span>
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(item.status.color)} text-xs`}
                          >
                            <div
                              className={`mr-1 h-1.5 w-1.5 rounded-full md:h-2 md:w-2 ${item.status.color === "green" ? "bg-green-500" : item.status.color === "blue" ? "bg-blue-500" : "bg-gray-500"}`}
                            />
                            {item.status.text}
                          </Badge>
                        </>
                      )}
                      {item.assignee && (
                        <>
                          <span className="text-muted-foreground">to</span>
                          <span className="text-foreground font-medium">
                            {item.assignee}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs sm:ml-auto md:text-sm">
                      {item.timestamp}
                    </span>
                  </div>

                  {/* Tags */}
                  {item.tags && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <div
                            className={`h-1.5 w-1.5 rounded-full md:h-2 md:w-2 ${getTagColor(tag.color)}`}
                          />
                          <span className="text-muted-foreground text-xs md:text-sm">
                            {tag.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment */}
                  {item.comment && (
                    <div className="bg-muted text-muted-foreground mt-2 rounded-lg p-2 text-xs leading-relaxed md:mt-3 md:p-3 md:text-sm">
                      {item.comment}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
