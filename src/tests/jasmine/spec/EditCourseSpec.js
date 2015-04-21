/**
 * Copyright 2015 Adam Brunnmeier, Dominik Studer, Alexandra Wörner, Frederik Zwilling, Ali Demiralp, Dev Sharma, Luca Liehner, Marco Dung, Georgios Toubekis
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Tests from menuToolbar.js: Checks, if all functionality implemented in the 
 * toolbar is working correctly
 */
describe('The edit page', function() {
  course = 1;

  beforeEach(function() {
    loadFixtures("btnOpenbox.html", "editPage.html", "model.html", "search.html");
  });

  // Tests for startBlackout
  it("darkens when the 'Add models' button is clicked", function() {
    expect($("#blackout").css("display")).toEqual("none");
    spyOn(window, "getModels");

    $("#openbox").click();
    expect($("#blackout").css("display")).toEqual("block");
  });

  // Test for getModels
  it("sends a request to the server to retrieve all models", function() {
     spyOn(window, "getModels");
     $("#openbox").click()
     expect(getModels).toHaveBeenCalled();
  });

   // Tests for endBlackout
  it("brightens when the 'Close' button is clicked", function() {
    $("#blackout").css("display", "block");
    $("#closebox").click();
    expect($("#blackout").css("display")).toEqual("none");
  });

  it("brightens when the user clicks outside the pop-up", function() {
    $("#blackout").css("display", "block");
    $("#blackout").click();
    expect($("#blackout").css("display")).toEqual("none");
  });

  it("closes the pop-up when the 'Close' button is clicked", function() {
    $("#modelbox").css("display", "block");
    $("#closebox").click();
    expect($("#modelbox").css("display")).toEqual("none");
  });

  it("closes the pop-up when the user clicks outside the pop-up", function() {
    $("#modelbox").css("display", "block");
    $("#closebox").click();
    expect($("#modelbox").css("display")).toEqual("none");
  });

  it("does not select any models anymore when the pop-up is closed", function() {
    selectedModels = {1: "object1", 2: "object2"};
    $("#closebox").click();
    expect(selectedModels).toBeEmpty();
  });

  // Tests for toggleSelectModel
  it("highlights the clicked model in the pop-up", function() {
    expect(selectedModels).toBeEmpty();
    expect($("#image-over1")).not.toHaveClass("highlight-model");
    $(".text-content").on("click",toggleSelectModel);

    $(".text-content > span").click();
    expect($("#image-over1")).toHaveClass("highlight-model");
    expect(selectedModels).toEqual({1: "1"});
  });

  it("removes the highlight when a selected model is clicked again in the pop-up", 
    function() {
      expect(selectedModels).toEqual({1: "1"});
      $("#img-over1").addClass("div-highlight");
      $(".text-content").on("click",toggleSelectModel);

      $(".text-content > span").click();
      expect($("#img-over1")).not.toHaveClass("div-highlight");
      expect(selectedModels).toBeEmpty();
  });

  // Tests for addModels
  it("sends a request to the server to save all selected models", function() {
    selectedModels = {1: "object1", 2: "object2"};
    spyOn(window, "addModels").and.callThrough();
    spyOn(ajax, "post");

    $("#addmodels").click();
    expect(addModels).toHaveBeenCalled();
    expect(ajax.post).toHaveBeenCalled();
    expect(ajax.post.calls.mostRecent().args[1]).toEqual({"course": 1, "models": '{"1":"object1","2":"object2"}'});
  });
});
