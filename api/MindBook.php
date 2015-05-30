<?php

require_once "Database.php";

Class MindBook {

    private $homeIdeaID = 1;

    public function MindBook() {
        
    }

    public function getHome() {
        return $this->getIdea($this->homeIdeaID);
    }

    public function getHomeIdeaID() {
        return $this->homeIdeaID;
    }

    public function getIdea($targetID) {
        $idea = new Idea($targetID);
        return $idea->__toString();
    }

    public function getAllChildrenOfIdea($targetID) {
        $idea = new Idea($targetID);
        $idea->loadAllChildren();
        return $idea;
    }

    public function getCounterIndex() {
        $id = -1;
        $sth = Database::$db->prepare('SELECT id
            FROM idea
            ORDER BY id DESC LIMIT 0,1');

        $sth->execute();

        foreach ($sth->fetchAll() as $row) {
            $id = $row["id"];
        }

        return $id;
    }

    public function getInitData() {
        $array = array();
        $array["counter"] = $this->getCounterIndex();
        $array["home"] = $this->getHomeIdeaID();
        return json_encode($array);
    }

    public function findIdeas($termenCautat) {

        function findCharByType($content, $char, $start, $type) {
            if ($type == 'before') {
                return strripos($content, $char, $start);
            } else {
                // after
                return strpos($content, $char, $start);
            }
        }

        function findBeforeWordStops($content, $startingPosition) {
            $allowedLimit = 30;

            $nextSpacePosition = findCharByType($content, " ", $startingPosition, "before");

            if ($nextSpacePosition === false ||
                    $startingPosition - $nextSpacePosition > $allowedLimit) {
                // find the next breaking line
                $nextBreakingLine = findCharByType($content, "\n", $startingPosition, "before");
                if ($nextBreakingLine === false ||
                        $startingPosition - $nextBreakingLine > $allowedLimit) {
                    return $startingPosition - $allowedLimit;
                }
                return $nextBreakingLine;
            }
            return $nextSpacePosition;
        }

        function findAfterWordStops($content, $startingPosition) {
            $allowedLimit = 30;

            $nextSpacePosition = findCharByType($content, " ", $startingPosition, "after");

            if ($nextSpacePosition === false ||
                    $nextSpacePosition - $startingPosition > $allowedLimit) {
                // find the next breaking line
                $nextBreakingLine = findCharByType($content, "\n", $startingPosition, "after");
                if ($nextBreakingLine === false ||
                        $nextBreakingLine - $startingPosition > $allowedLimit) {
                    return $startingPosition + $allowedLimit;
                }
                return $nextBreakingLine;
            }
            return $nextSpacePosition;
        }

        function getOccurences($content, $term, $isParent) {

            $occurences = array();
            $tempArray = array();

            $maxLengthOfContent = 20;
            $charactersToShow = 20;

            $lastPos = 0;
            $times = "ALL";
            $number = 0;

            $lungimeContent = strlen($content);
            $lungimeTermen = strlen($term);

            if ($lungimeContent > $maxLengthOfContent && !$isParent) {
                // find the first occurence
                while (($position = stripos($content, $term, $lastPos)) !== false) {

                    $isCuttedBefore = true;
                    $isCuttedAfter = true;
                    $occContent = "";

                    // before term
                    $startBeforePosition = intval($position - $charactersToShow);

                    //find the end of the word before
                    if ($startBeforePosition < 0) {
                        $startBeforePosition = 0;
                    }
                    $startPositionBeforeWord = $startBeforePosition - $lungimeContent + 1;

                    $positionEndOfPreviousWord = findBeforeWordStops($content, $startPositionBeforeWord);

                    if ($positionEndOfPreviousWord === FALSE) {
                        $startBeforePosition = 0;
                    } else {
                        $startBeforePosition = $positionEndOfPreviousWord;
                    }

                    if ($startBeforePosition <= 0) {
                        $startBeforePosition = 0;
                        $isCuttedBefore = false;
                    }
                    $lungimeBefore = $position - $startBeforePosition;


                    // after term          
                    $startAfterPosition = $position + $lungimeTermen;
                    $lungimeAfter = $charactersToShow;


                    $startPositionWord = intval($startAfterPosition) + intval($lungimeAfter);
                    if ($startPositionWord >= $lungimeContent) {
                        // nothing
                    } else {
                        $positionOfWordAfter = findAfterWordStops($content, $startPositionWord);
                        if ($positionOfWordAfter === FALSE) {
                            //
                        } else {
                            $charactersToAdd = $positionOfWordAfter - $startPositionWord;
                            $lungimeAfter = intval($lungimeAfter) + intval($charactersToAdd);
                        }
                    }

                    if ($startAfterPosition + $lungimeAfter >= $lungimeContent) {
                        $isCuttedAfter = false;
                    }

                    // process
                    $beforeText = substr($content, $startBeforePosition, $lungimeBefore);
                    $termText = substr($content, $position, $lungimeTermen);
                    $afterText = substr($content, $startAfterPosition, $lungimeAfter);

                    $newText = $beforeText . $termText . $afterText;
                    $occContent .= $newText;

                    $number = $number + 1;

                    if ($times !== "ALL" && $times === $number) {
                        break;
                    }

                    $lastPos = $position + $lungimeTermen;

                    $oc = array(
                        "before" => $isCuttedBefore,
                        "line" => $number,
                        "content" => $occContent,
                        "after" => $isCuttedAfter);
                    array_push($tempArray, $oc);
                }
                $occurences["content"] = $tempArray;
            } else {
                $occurences["content"] = $content;
            }


            $occurences["number"] = $number;

            return $occurences;
        }


        $toReturn = array();

        $sth = Database::$db->prepare('SELECT id, content, parent
            FROM idea
            WHERE content LIKE ?
            LIMIT 0,10');

        $sth->execute(array("%" . $termenCautat . "%"));

        foreach ($sth->fetchAll() as $row) {
            $content = $row["content"];
            $id = $row["id"];
            $parent_id = $row["parent"];

            $safeContent = getOccurences($content, $termenCautat, false);

            if ($parent_id !== null) {
                $parentIdea = new ChildIdea($parent_id);
                $parent = array("id" => $parentIdea->getId(),
                    "content" => getOccurences($parentIdea->getContent(), $termenCautat, true));
            } else {
                $parent = null;
            }


            array_push($toReturn, array("id" => $id, "content" => $safeContent, 'parent' => $parent));
        }
        return json_encode($toReturn);
    }

    function createIdea($parent_id, $content, $id) {

        $parent = new ChildIdea($parent_id);

        $path = $parent->getPath() . "[" . $parent->getId() .']';

        $stmt = Database::$db->prepare("INSERT INTO idea (id, path, content, parent) VALUES (:id, :path, :content, :parent)");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':path', $path);
        $stmt->bindParam(':content', $content);
        $stmt->bindParam(':parent', $parent_id);
        $stmt->execute();
        return "true";
    }

    public function checkIdeaExistsById($id) {
        $sth = Database::$db->prepare('SELECT id, content
            FROM idea
            WHERE id = :id
            LIMIT 0,1');

        $sth->bindParam(':id', $id);

        $sth->execute();

        foreach ($sth->fetchAll() as $row) {
            return "true";
        }
        return "false";
    }

    public function findIdeaIdByContentAndParent($parent, $content) {
        $sth = Database::$db->prepare('SELECT id
            FROM idea
            WHERE parent = :parent AND
                  content = :content
            LIMIT 0,1');

        $sth->bindParam(':parent', $parent);
        $sth->bindParam(':content', $content);

        $sth->execute();

        foreach ($sth->fetchAll() as $row) {
            return $row['id'];
        }
        return null;
    }

    public function checkIdeaExists($parent, $content) {

        $id = $this->findIdeaIdByContentAndParent($parent, $content);
        if ($id !== null) {
            return "true";
        }
        return "false";
    }

    public function clearAll() {

        // delete idea
        $stmt2 = Database::$db->prepare('DELETE from idea
        WHERE id > 1 ');
        $stmt2->execute();
    }

    public function updateIdea($id, $newContent, $parentID, $requestId, $childrenJSON) {
        $report = array();

        $currentIdExists = $this->checkIdeaExistsById($id);
        $similarIdeaExits = $this->checkIdeaExists($parentID, $newContent);

        if ($similarIdeaExits === "true") {

            $corr_id = $this->findIdeaIdByContentAndParent($parentID, $newContent);

            $correspondingIdea = new ChildIdea($corr_id);

            // it is the same
            if ($correspondingIdea->getId() == $id) {

                // CHECK THE PARENT
                if ($correspondingIdea->getParent() != $parentID) {
                    // UPDATE IT
                    $correspondingIdea->setContent($newContent);
                    $correspondingIdea->setParent($parentID);
                    $report["status"] = "update";
                    $report["id"] = $id;
                } else {
                    $report["status"] = "no_change";
                }
            } else {


                if ($currentIdExists === "true") {
                    // change the children to the new one
                    // delete it
                    // mark it as the corresponding
                    $oldIdea = new ChildIdea($id);


                    $oldIdea->changeParentOfChildren($correspondingIdea->getId(), $correspondingIdea->getPath());

                    $oldIdea->remove();
                }

                $report["status"] = "correspondence";
                $report["id"] = $correspondingIdea->getId();
            }
            // change parent of the children to the new one 
        } else {
            // the id is not
            if ($currentIdExists === "false") {
                $this->createIdea($parentID, $newContent, $id);
                $idea = new ChildIdea($id);

                $parent = $idea->getId();
                $path = $idea->getPath() . "[" . $parent . ']';

                // take back its children
                $children = explode(',', $childrenJSON);

                // in case it was associated 
                foreach ($children as $id) { //forea
                    $stmt = Database::$db->prepare('UPDATE idea
                        SET parent = :parent, path = :path       
                        WHERE id = :id ');
                    $stmt->bindParam(':parent', $parent);
                    $stmt->bindParam(':path', $path);
                    $stmt->bindParam(':id', $id);
                    $stmt->execute();
                    $report["children_change"] = "true";
                }

                $report["status"] = "create";
            } else {
                $report["status"] = "update";
                $oldIdea = new ChildIdea($id);

                // UPDATE IT
                $oldIdea->setContent($newContent);
                $oldIdea->setParent($parentID);
            }
            $report["id"] = $id;
        }

        $report["requestId"] = $requestId;

        echo json_encode($report);
    }

}
